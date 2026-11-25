
export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    const send = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (request.method === "GET") {
      return send({ status: "ZOE AI ONLINE" });
    }

    if (request.method !== "POST") {
      return send({ error: "Method not allowed" }, 405);
    }

    try {
      if (!env.GEMINI_API_KEY) {
        return send({ error: "API key missing" }, 500);
      }

      const body = await request.json();

      if (typeof body.message !== "string" || !body.message.trim()) {
        return send({ error: "Message required" }, 400);
      }

      const apiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: "You are ZOE AI, a friendly and intelligent female virtual assistant. Speak naturally in Iraqi Arabic. Be warm, helpful, honest and conversational."
              }]
            },
            contents: [{
              role: "user",
              parts: [{ text: body.message }]
            }]
          })
        }
      );

      const result = await apiResponse.json();

      if (!apiResponse.ok) {
        return send({
          error: result.error?.message || "Gemini API error"
        }, apiResponse.status);
      }

      const reply = result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "No response received.";

      return send({ reply });

    } catch (error) {
      return send({ error: "Server error" }, 500);
    }
  }
};
