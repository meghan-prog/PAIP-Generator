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

        if (body.action === 'send_email') {
          const { email, niche, doelgroep, probleem, url, paips, voorna_zonder, voorna_met, voorna_bottom } = body;
          if (!email || !paips?.length) return new Response('Missing data', { status: 400 });

          // Subscribe to Systeme.io
          try {
            const tagsRes = await fetch('https://api.systeme.io/api/tags?limit=100', {
              headers: { 'X-API-Key': env.SYSTEME_API_KEY }
            });
            const tagsData = await tagsRes.json();
            const tag = tagsData.items?.find(t => t.name === 'PAIP Generator');
            const contactBody = { email };
            if (tag) contactBody.tags = [{ id: tag.id }];
            await fetch('https://api.systeme.io/api/contacts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-API-Key': env.SYSTEME_API_KEY },
              body: JSON.stringify(contactBody)
            });
          } catch(e) { /* non-fatal */ }

          // Build email HTML
          const paipCards = paips.map((p, i) => `
            <div style="background:#fff;border:1px solid #d4c9bb;border-radius:12px;padding:20px;margin-bottom:16px;">
              <div style="font-size:12px;color:#8a7a70;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">${p.type} &nbsp;·&nbsp; ${p.bouwtijd} &nbsp;·&nbsp; ${p.prijs}</div>
              <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#2e0e02;margin-bottom:8px;">${i + 1}. ${p.titel}</div>
              <div style="font-size:14px;color:#4a3728;line-height:1.6;margin-bottom:10px;">${p.beschrijving}</div>
              <div style="background:#f9f5f0;border-left:3px solid #8B271E;padding:10px 14px;border-radius:0 8px 8px 0;">
                <div style="font-size:11px;font-weight:600;color:#8B271E;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;">Waarom dit werkt</div>
                <div style="font-size:13px;color:#4a3728;line-height:1.55;">${p.waarom}</div>
              </div>
              <div style="margin-top:10px;font-size:12px;color:#8a7a70;">Model: ${p.model}</div>
            </div>`).join('');

          const htmlEmail = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#E9DFD3;font-family:'DM Sans',Arial,sans-serif;">
            <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;background:#2e0e02;color:#E9DFD3;font-family:Georgia,serif;font-weight:700;font-size:14px;letter-spacing:0.1em;padding:8px 16px;border-radius:8px;">PAIP GENERATOR</div>
              </div>
              <h1 style="font-family:Georgia,serif;font-size:26px;color:#2e0e02;margin:0 0 8px;">Jouw 5 PAIP-ideeën</h1>
              <p style="font-size:14px;color:#8a7a70;margin:0 0 24px;">Voor niche: <strong>${niche || url || 'jouw business'}</strong>${doelgroep ? ` · Doelgroep: ${doelgroep}` : ''}</p>
              ${paipCards}
              <p style="font-size:12px;color:#8a7a70;text-align:center;margin-top:24px;">Je ontvangt dit omdat je de PAIP Generator hebt gebruikt op paipgenerator.nl</p>
            </div>
          </body></html>`;

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: 'Meghan Eckenbach <meghan@e-mand.com>',
              to: [email],
              subject: `Jouw 5 PAIP-ideeën voor ${niche || url || 'jouw business'}`,
              html: htmlEmail
            })
          });

          const emailData = await emailRes.json();
          if (emailData.error) {
            return new Response(JSON.stringify({ error: emailData.error }), { status: 500, headers: { 'Content-Type': 'application/json' } });
          }

          return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
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

          const contactRes = await fetch('https://api.systeme.io/api/contacts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': env.SYSTEME_API_KEY
            },
            body: JSON.stringify(contactBody)
          });

          const contactData = await contactRes.json();

          return new Response(JSON.stringify({ ok: true, status: contactRes.status, tag, contactData }), {
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
