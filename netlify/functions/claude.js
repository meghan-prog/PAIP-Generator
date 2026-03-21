exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);

    // Website fetch via server (geen CORS probleem)
    if (body.action === "fetch_website") {
      try {
        let url = body.url.trim();
        if (!url.startsWith('http')) url = 'https://' + url;

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
          signal: AbortSignal.timeout(8000)
        });

        const html = await res.text();
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 3000);

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        };
      } catch(e) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: '' })
        };
      }
    }

    // Claude API call
    if (body.action === "generate") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: body.prompt }]
        })
      });

      const data = await response.json();

      if (data.error) {
        return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
      }

      const text = data.content.map(i => i.text || "").join("");
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      };
    }

    return { statusCode: 400, body: "Unknown action" };

  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
