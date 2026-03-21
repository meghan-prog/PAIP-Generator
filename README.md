# PAIP Generator

A personalized AI product generator built by [Meghan Eckenbach](https://meghaneckenbach.com). Users answer 3 questions about their niche, audience, and client problem — and receive 5 tailored PAIP ideas with descriptions, pricing, and build time.

## What is a PAIP?

A **Personalized Automated Intelligent Product** is an AI-powered tool where a user fills in a form and receives a unique, customized output. Examples include scanners, calculators, audits, planners, and AI assistants — all generated on-demand.

## Features

- Website scraping for extra context (server-side, no CORS)
- 5 PAIP ideas generated via Claude AI (claude-sonnet-4)
- Email wall to unlock 3 premium PAIPs
- Systeme.io integration for lead capture
- Animated loading sequence with progress bar
- Mobile-first design (max-width 480px)

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (single file)
- **Backend**: Netlify Functions (Node.js)
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Email/CRM**: Systeme.io API
- **Hosting**: Netlify

## Project Structure

```
paip-generator/
├── index.html                    # Frontend (single-page app)
├── netlify.toml                  # Netlify config + redirects
├── .env.example                  # Environment variable template
├── .gitignore
├── README.md
└── netlify/
    └── functions/
        └── claude.js             # Serverless function (Claude API + website fetch)
```

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/paip-generator.git
cd paip-generator
```

### 2. Connect to Netlify

Deploy via the [Netlify UI](https://app.netlify.com) by connecting your GitHub repo, or use the CLI:

```bash
npm install -g netlify-cli
netlify init
```

### 3. Set environment variables

In Netlify → Site settings → Environment variables, add:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Or copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
# then fill in your key
```

### 4. Configure Systeme.io (optional)

In `index.html`, update the constants at the top of the `<script>` block:

```js
const SYSTEME_API_KEY = "YOUR_SYSTEME_API_KEY";
const SYSTEME_TAG_ID  = 12345; // your tag ID, or 0 to skip tagging
```

### 5. Update the Calendly link

In `index.html`, find and replace:

```html
onclick="window.open('https://calendly.com/jouw-link','_blank')"
```

Replace `jouw-link` with your actual Calendly URL.

## Local Development

```bash
netlify dev
```

This runs the frontend and serverless functions locally at `http://localhost:8888`.

## Deployment

Push to `main` — Netlify auto-deploys on every commit.

---

Built with the PAIP methodology. Questions? [meghaneckenbach.com](https://meghaneckenbach.com)
