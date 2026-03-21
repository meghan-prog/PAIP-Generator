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
          const isPremium = (i) => i >= 2;

          const paipCards = paips.map((p, i) => {
            const featured = isPremium(i);
            const numBg = featured ? '#8B271E' : 'rgba(139,39,30,0.12)';
            const numColor = featured ? '#ffffff' : '#2e0e02';
            const cardBorder = featured ? '#8B271E' : '#d4c9bb';
            const cardBg = featured ? 'linear-gradient(160deg,#fdf6f0,#ffffff)' : '#ffffff';
            const headerBg = featured ? 'rgba(139,39,30,0.08)' : '#f5f0ea';
            const badge = featured ? '⭐ Premium' : `PAIP ${i + 1}`;
            return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border-radius:14px;border:1px solid ${cardBorder};background:${cardBg};overflow:hidden;">
              <tr>
                <td style="padding:10px 18px;background:${headerBg};border-bottom:1px solid ${cardBorder};">
                  <span style="font-family:Oswald,Arial,sans-serif;font-weight:600;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#8B271E;">${badge}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:18px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                    <tr>
                      <td style="width:28px;vertical-align:middle;">
                        <div style="width:26px;height:26px;background:${numBg};border-radius:6px;text-align:center;line-height:26px;font-family:Oswald,Arial,sans-serif;font-weight:700;font-size:13px;color:${numColor};">${i + 1}</div>
                      </td>
                      <td style="padding-left:8px;vertical-align:middle;">
                        <span style="display:inline-block;background:#f5f0ea;border:1px solid #d4c9bb;border-radius:999px;padding:3px 11px;font-size:12px;color:#2e0e02;">${p.type}</span>
                      </td>
                      <td style="text-align:right;vertical-align:middle;">
                        <span style="font-size:12px;color:#8a7a70;">⏱ ${p.bouwtijd}</span>
                      </td>
                    </tr>
                  </table>
                  <div style="font-family:Oswald,Arial,sans-serif;font-weight:600;font-size:18px;text-transform:uppercase;letter-spacing:0.01em;color:#2e0e02;margin-bottom:8px;">${p.titel}</div>
                  <div style="font-size:14px;color:#8a7a70;line-height:1.65;margin-bottom:14px;">${p.beschrijving}</div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                    <tr>
                      <td style="border-left:3px solid #8B271E;padding:12px 14px;background:rgba(139,39,30,0.06);border-radius:0 8px 8px 0;">
                        <div style="font-family:Oswald,Arial,sans-serif;font-weight:600;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B271E;margin-bottom:5px;">Waarom dit werkt</div>
                        <div style="font-size:13px;color:#2e0e02;line-height:1.65;">${p.waarom}</div>
                      </td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #d4c9bb;padding-top:12px;">
                    <tr>
                      <td style="padding-top:12px;vertical-align:middle;">
                        <span style="font-family:Oswald,Arial,sans-serif;font-size:11px;letter-spacing:0.07em;text-transform:uppercase;color:#c8bdb3;">Verkoopprijs</span>
                        &nbsp;
                        <span style="font-family:Oswald,Arial,sans-serif;font-weight:700;font-size:22px;color:#8B271E;">${p.prijs}</span>
                      </td>
                      <td style="text-align:right;padding-top:12px;vertical-align:middle;">
                        <span style="font-size:12px;color:#8a7a70;">${p.model}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>`;
          }).join('');

          const voornaBlock = (voorna_zonder || voorna_met) ? `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border-radius:14px;border:1px solid #d4c9bb;background:#ffffff;overflow:hidden;">
              <tr><td style="padding:18px;">
                <div style="font-family:Oswald,Arial,sans-serif;font-weight:600;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#2e0e02;margin-bottom:14px;">Jouw situatie in perspectief</div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="48%" style="vertical-align:top;padding-right:8px;">
                      <div style="font-family:Oswald,Arial,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a7a70;margin-bottom:6px;">Zonder PAIP</div>
                      <div style="font-size:13px;color:#8a7a70;line-height:1.6;">${(voorna_zonder || '').replace(/\n/g,'<br>')}</div>
                    </td>
                    <td width="4%" style="border-left:1px solid #d4c9bb;">&nbsp;</td>
                    <td width="48%" style="vertical-align:top;padding-left:8px;">
                      <div style="font-family:Oswald,Arial,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8B271E;margin-bottom:6px;">Met PAIP</div>
                      <div style="font-size:13px;color:#2e0e02;font-weight:500;line-height:1.6;">${(voorna_met || '').replace(/\n/g,'<br>')}</div>
                    </td>
                  </tr>
                </table>
                ${voorna_bottom ? `<div style="margin-top:14px;padding-top:14px;border-top:1px solid #d4c9bb;font-size:13px;color:#8a7a70;line-height:1.6;font-style:italic;">${voorna_bottom}</div>` : ''}
              </td></tr>
            </table>` : '';

          const htmlEmail = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<title>Jouw 5 PAIP-ideeën</title>
</head>
<body style="margin:0;padding:0;background:#E9DFD3;font-family:'DM Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E9DFD3;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;">

      <!-- NAV -->
      <tr><td style="padding-bottom:28px;border-bottom:1px solid #d4c9bb;margin-bottom:28px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:34px;height:34px;background:#2e0e02;border-radius:6px;text-align:center;vertical-align:middle;">
              <span style="font-family:Oswald,Arial,sans-serif;font-weight:700;font-size:13px;color:#E9DFD3;letter-spacing:0.02em;">ME</span>
            </td>
            <td style="padding-left:10px;vertical-align:middle;">
              <span style="font-family:Oswald,Arial,sans-serif;font-weight:600;font-size:15px;letter-spacing:0.07em;text-transform:uppercase;color:#2e0e02;">Meghan <span style="color:#8B271E;">Eckenbach</span></span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- HEADER -->
      <tr><td style="padding:28px 0 20px;">
        <div style="font-family:Oswald,Arial,sans-serif;font-weight:700;font-size:34px;line-height:1.0;text-transform:uppercase;color:#2e0e02;">JOUW 5<br><span style="color:#8B271E;">PAIP-IDEEËN</span></div>
        <div style="font-size:14px;color:#8a7a70;margin-top:10px;line-height:1.6;">
          Voor: <strong style="color:#2e0e02;">${niche || url || 'jouw business'}</strong>${doelgroep ? `<br>Doelgroep: ${doelgroep}` : ''}
        </div>
      </td></tr>

      <!-- VOOR/NA -->
      <tr><td>${voornaBlock}</td></tr>

      <!-- PAIP CARDS -->
      <tr><td>
        <div style="font-family:Oswald,Arial,sans-serif;font-weight:600;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#2e0e02;margin-bottom:14px;">Jouw ideeën</div>
        ${paipCards}
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding-top:28px;border-top:1px solid #d4c9bb;text-align:center;">
        <div style="font-family:Oswald,Arial,sans-serif;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#c8bdb3;">PAIP Generator &nbsp;·&nbsp; Meghan Eckenbach</div>
        <div style="font-size:11px;color:#c8bdb3;margin-top:6px;">Je ontvangt dit omdat je de PAIP Generator hebt gebruikt.</div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

          await fetch('https://hook.eu2.make.com/4277r5dhrnvwptaqc2y824brmgwc8xko', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject: `Jouw 5 PAIP-ideeën voor ${niche || url || 'jouw business'}`,
              html: htmlEmail
            })
          });

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
