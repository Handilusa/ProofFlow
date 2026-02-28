import "dotenv/config";

async function testREST() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim().replace(/['"]/g, '');
    const modelName = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    console.log("URL:", url.replace(apiKey, "HIDDEN"));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        console.log("Status:", response.status);
        const data = await response.json();
        console.log("Body:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Critical Error:", err.message);
    }
}

testREST();
