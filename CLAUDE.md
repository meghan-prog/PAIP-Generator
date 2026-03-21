# PAIP Generator - Project Notes

## Deployment
- **Platform: Cloudflare Workers** (NOT Netlify)
- Main worker file: `worker.js`
- Config: `wrangler.toml`
- API endpoint: `/api/claude`

## Environment Variables (set in Cloudflare Dashboard)
- `ANTHROPIC_API_KEY` — Claude API
- `SYSTEME_API_KEY` — systeme.io API key

## Systeme.io Integration
- Email subscribers are sent server-side via the worker (`action: "subscribe"`)
- Contacts are tagged with **"PAIP Generator"** in systeme.io
- Tag lookup is done by name at subscribe time
