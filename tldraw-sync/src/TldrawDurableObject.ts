/*** 1. Main worker code (index.ts) ***/
import { RoomSnapshot, TLSocketRoom } from '@tldraw/sync-core'
import {
	TLRecord,
	createTLSchema,
	defaultShapeSchemas,
} from '@tldraw/tlschema'
import { AutoRouter, IRequest, error } from 'itty-router'
import throttle from 'lodash.throttle'

// The Cloudflare DO environment. You can adjust as needed.
interface Env {
	// The Durable Object binding for TldrawDurableObject
	TLDRAW_ROOM: DurableObjectNamespace

	// R2 bucket for storing snapshots
	TLDRAW_BUCKET: R2Bucket
}

// If you have custom shapes / bindings, expand them here
const schema = createTLSchema({
	shapes: { ...defaultShapeSchemas },
})

// Durable Object using the Hibernation WebSocket API
export class TldrawDurableObject implements DurableObject {
	private roomId: string | null = null
	private roomPromise: Promise<TLSocketRoom<TLRecord, void>> | null = null

	// Keep references so we can route DO “webSocketMessage” events to the correct session
	private sockets = new Map<WebSocket, { sessionId: string }>()

	constructor(private readonly ctx: DurableObjectState, private readonly env: Env) {
		// Example: retrieve roomId from Durable Object storage
		ctx.blockConcurrencyWhile(async () => {
			this.roomId = (await this.ctx.storage.get<string>('roomId')) ?? null
		})
	}

	// Create an itty-router that routes requests within this DO
	private readonly router = AutoRouter({
		catch: (e: unknown) => {
			console.log(e)
			return error(e)
		},
	})
		// Our connection endpoint:
		.get('/connect/:roomId', async (request: IRequest) => {
			const { roomId } = request.params
			if (!this.roomId) {
				// If this DO was never initialized with a roomId, store it
				await this.ctx.blockConcurrencyWhile(async () => {
					await this.ctx.storage.put('roomId', roomId)
					this.roomId = roomId
				})
			}
			return this.handleConnect(request)
		})

	// Main entry point for the DO
	async fetch(request: Request): Promise<Response> {
		return this.router.handle(request)
	}

	/**
	 * Called by the router when a client tries to connect via /connect/:roomId
	 * We create the webSocketPair, accept it at the DO level, store session info,
	 * and hand bridging logic over to the DO event handlers below.
	 */
	private async handleConnect(request: IRequest): Promise<Response> {
		const sessionId = request.query.sessionId as string
		if (!sessionId) return error(400, 'Missing sessionId')

		// Create the WebSocket pair
		const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair()

		// Hibernation approach: do NOT call serverWebSocket.accept() here
		// Instead, tell the runtime “We handle this connection with DO event handlers.”
		this.ctx.acceptWebSocket(serverWebSocket)

		// Prepare and store the DO references for bridging
		this.sockets.set(serverWebSocket, { sessionId })

		// Ensure the TLSocketRoom is loaded (from R2 or from memory)
		const room = await this.getRoom()

		// Let the Tldraw library set up internal listeners etc.
		// It will expect to do `socket.addEventListener('message', ...)`.
		// That won't automatically be called. We'll forward messages in `webSocketMessage()`.
		// But we do call the library's "connect" method so it can track that this user is present:
		room.handleSocketConnect({
			sessionId,
			socket: serverWebSocket,
		})

		// Return the “client” side to the caller with an HTTP 101 (Switching Protocols).
		return new Response(null, {
			status: 101,
			webSocket: clientWebSocket,
		})
	}

	/**
	 * Load or create a TLSocketRoom that tracks this whiteboard’s state.
	 * We store snapshots in an R2 bucket.
	 */
	private async getRoom(): Promise<TLSocketRoom<TLRecord, void>> {
		if (!this.roomId) {
			throw new Error('Room ID not set!')
		}

		if (!this.roomPromise) {
			this.roomPromise = (async () => {
				// Attempt to load a snapshot from R2
				const key = `rooms/${this.roomId}`
				const storedObj = await this.env.TLDRAW_BUCKET.get(key)
				const initialSnapshot = storedObj
					? (await storedObj.json()) as RoomSnapshot
					: undefined

				// Create a new room from the Tldraw library
				return new TLSocketRoom<TLRecord, void>({
					schema,
					initialSnapshot,
					onDataChange: () => {
						// Throttled persist so it only triggers every 10s
						this.schedulePersistToR2()
					},
				})
			})()
		}
		return this.roomPromise
	}

	/**
	 * Throttle function that writes the current room state to R2.
	 */
	private schedulePersistToR2 = throttle(async () => {
		if (!this.roomPromise || !this.roomId) return
		const room = await this.getRoom()
		const snapshot = JSON.stringify(room.getCurrentSnapshot())
		await this.env.TLDRAW_BUCKET.put(`rooms/${this.roomId}`, snapshot)
	}, 10_000)

	/* ----------------------------------------------------------------------
	 * Durable Object WebSocket Hibernation Event Handlers
	 * These are invoked whenever a message or close/error event arrives
	 * after we call this.ctx.acceptWebSocket().
	 * ---------------------------------------------------------------------- */

	/**
	 * Received a new message from a WebSocket within this DO.
	 * We forward that to TLSocketRoom so it can perform its sync logic.
	 */
	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		// Look up which user / session this ws belongs to:
		const info = this.sockets.get(ws)
		if (!info) return

		// Depending on how TLSocketRoom expects messages, it might
		// parse them or expect them as a string. We'll pass them directly.
		// If the library does its own `socket.onmessage` handlers,
		// we can artificially emit an event. For example:
		const event = {
			type: 'message',
			data: message,
		}

		// forward to library’s internal event logic. The library might parse
		// that object, or you can parse JSON first. Example:
		// room.handleSocketMessage(info.sessionId, event)
		// or forcibly dispatch an event:
		// ws.dispatchEvent(new MessageEvent('message', { data: message }));

		// If your library has a direct method for “incoming raw data”:
		const room = await this.getRoom()
		if (typeof room.handleRawMessage === 'function') {
			// Hypothetical function. Tweak as needed:
			room.handleRawMessage(info.sessionId, message)
		} else {
			// Fallback bridging approach: forcibly dispatch an event so the existing
			// Tldraw addEventListener('message') logic sees it:
			// serverWebSocket.addEventListener('message', callback) won't be called automatically,
			// so we do this manually:
			const evt = new MessageEvent('message', { data: message })
			// @ts-expect-error We’re forcibly dispatching an event to the original socket
			ws.dispatchEvent(evt)
		}
	}

	/**
	 * Handle close events. Typically you’d remove references and notify the room that
	 * this client is gone.
	 */
	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		const info = this.sockets.get(ws)
		if (!info) return
		const { sessionId } = info
		this.sockets.delete(ws)

		const room = await this.getRoom()
		if (typeof room.handleSocketDisconnect === 'function') {
			room.handleSocketDisconnect(sessionId)
		}
	}

	/**
	 * Handle errors. Typically you’d remove references, log them, etc.
	 */
	async webSocketError(ws: WebSocket, error: unknown) {
		console.error('DO WebSocket error for tldraw:', error)
		// If we want to forcibly close on an error:
		ws.close(1011, 'Internal error in Tldraw DO')
		this.sockets.delete(ws)
	}
}
