# PAIP Generator

A personalized AI product generator built by [Meghan Eckenbach](https://meghaneckenbach.com). Users answer 3 questions about their niche, audience, and client problem — and receive 5 tailored PAIP ideas with descriptions, pricing, and build time.

## What is a PAIP?

A **Personalized Automated Intelligent Product** is an AI-powered tool where a user fills in a form and receives a unique, customized output. Examples include scanners, calculators, audits, planners, and AI assistants — all generated on-demand.

## Features

- Website scraping for extra context (server-side, no CORS)
- 5 PAIP ideas generated via Claude AI (`claude-sonnet-4-20250514`)
- Email wall to unlock 3 premium PAIPs
- Systeme.io integration for lead capture
- Animated loading sequence with progress bar
- Mobile-first design (max-width 480px)

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (single file)
- **Backend**: Cloudflare Workers (Node.js-compatible runtime)
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Email/CRM**: Systeme.io API
- **Hosting**: Cloudflare

## Project Structure

```
paip-generator/
├── index.html        # Frontend (single-page app)
├── worker.js         # Cloudflare Worker (Claude API + website fetch + Systeme.io)
├── wrangler.toml     # Cloudflare Workers config
├── .gitignore
└── README.md
```

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/paip-generator.git
cd paip-generator
```

### 2. Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 3. Set environment variables

In the [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → your worker → Settings → Variables, add:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SYSTEME_API_KEY=your_systeme_api_key_here
```

### 4. Update the Calendly link

In `index.html`, find and replace:

```html
onclick="window.open('https://calendly.com/jouw-link','_blank')"
```

Replace `jouw-link` with your actual Calendly URL.

## Local Development

```bash
wrangler dev
```

This runs the worker and frontend locally at `http://localhost:8787`.

## Deployment

```bash
wrangler deploy
```

Or push to your connected GitHub repo if you have Cloudflare Pages/Workers CI set up.

---

Built with the PAIP methodology. Questions? [meghaneckenbach.com](https://meghaneckenbach.com)
