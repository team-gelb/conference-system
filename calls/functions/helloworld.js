export function onRequest(context) {
    return new Response(console.log(context));
}