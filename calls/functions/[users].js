export function onRequest(context) {
    const registeredUsers = [
        "Flynn",
        "Jacob"
    ];

    const checkUserIsRegistered = registeredUsers.includes(context.params.users)

    return new Response("Der Nutzer " + context.params.users + " ist" + (checkUserIsRegistered ? "" : " nicht") + " registriert.");
}
