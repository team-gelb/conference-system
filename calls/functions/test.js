export function onRequest(context) {
    const quotes = [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
        "Do what you can, with what you have, where you are. - Theodore Roosevelt",
        "Believe you can and you're halfway there. - Theodore Roosevelt",
        "It does not matter how slowly you go as long as you do not stop. - Confucius"
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    console.log("Generated Quote:", randomQuote);
    return new Response(JSON.stringify({ quote: randomQuote }), {
        headers: { "Content-Type": "application/json" }
    });
}
