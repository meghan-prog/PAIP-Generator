export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/claude' && request.method === 'POST') {
      try {
        const body = await request.json();

        if (body.action === 'fetch_website') {
          try {
            let fetchUrl = body.url.trim();
            if (!fetchUrl.startsWith('http')) fetchUrl = 'https://' + fetchUrl;

            const res = await fetch(fetchUrl, {
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

            return new Response(JSON.stringify({ text }), {
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (e) {
            return new Response(JSON.stringify({ text: '' }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        if (body.action === 'generate') {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 2000,
              messages: [{ role: 'user', content: body.prompt }]
            })
          });

          const data = await response.json();

          if (data.error) {
            return new Response(JSON.stringify({ error: data.error.message }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const text = data.content.map(i => i.text || '').join('');
          return new Response(JSON.stringify({ text }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (body.action === 'subscribe') {
          const email = body.email;
          if (!email) return new Response('Missing email', { status: 400 });

          // Find tag ID by name
          const tagsRes = await fetch('https://api.systeme.io/api/tags?limit=100', {
            headers: { 'X-API-Key': env.SYSTEME_API_KEY }
          });
          const tagsData = await tagsRes.json();
          const tag = tagsData.items?.find(t => t.name === 'PAIP Generator');

          const contactBody = { email };
          if (tag) contactBody.tags = [{ id: tag.id }];

          await fetch('https://api.systeme.io/api/contacts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': env.SYSTEME_API_KEY
            },
            body: JSON.stringify(contactBody)
          });

          return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response('Unknown action', { status: 400 });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Serve static files (index.html) for everything else
    return env.ASSETS.fetch(request);
  }
};
