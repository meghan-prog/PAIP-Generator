const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/claude', async (req, res) => {
  try {
    const body = req.body;

    if (body.action === 'fetch_website') {
      try {
        let url = body.url.trim();
        if (!url.startsWith('http')) url = 'https://' + url;

        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
          signal: AbortSignal.timeout(8000)
        });

        const html = await response.text();
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 3000);

        return res.json({ text });
      } catch (e) {
        return res.json({ text: '' });
      }
    }

    if (body.action === 'generate') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
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
        return res.status(500).json({ error: data.error.message });
      }

      const text = data.content.map(i => i.text || '').join('');
      return res.json({ text });
    }

    return res.status(400).send('Unknown action');

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PAIP Generator running on port ${PORT}`);
});
