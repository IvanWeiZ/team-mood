<div align="center">

# Team Mood

**Real-time anonymous mood feedback for your team.**

Get honest signal from your team in seconds — no round-robins, no awkward silences.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)

</div>

---

## Why Team Mood?

Skip the awkward round-robin. Get honest, anonymous feedback from your team in real-time. A facilitator creates a session, shares a code, and watches the mood dashboard update live as responses roll in — no accounts, no sign-ups, no friction.

## Features

- **🎯 Instant sessions** — Create a session and get a shareable 6-character code
- **🎭 Anonymous voting** — Pick a mood (😀 😐 😟 🔥) with an optional anonymous comment
- **📊 Live dashboard** — Bar chart of mood distribution + scrolling comment feed
- **⚡ Real-time updates** — Server-Sent Events with automatic 3-second polling fallback
- **📱 Mobile-friendly** — Clean, modern UI that works on any device
- **⏳ Auto-cleanup** — Sessions expire automatically after 24 hours
- **🔒 No accounts required** — Zero friction, zero data collection

## How It Works

| Step  | Who          | What                                                               |
| ----- | ------------ | ------------------------------------------------------------------ |
| **1** | Facilitator  | Creates a session → gets a 6-character code                        |
| **2** | Team members | Join with the code → pick a mood + optional comment                |
| **3** | Everyone     | Dashboard updates live with mood distribution + anonymous comments |

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Redis** instance (local or hosted — [Upstash](https://upstash.com/) works great for free)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/team-mood.git
cd team-mood

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
```

Add your Redis connection string to `.env.local`:

```env
REDIS_URL=redis://localhost:6379
```

```bash
# Start the dev server
npm run dev
```

Open [http://localhost:3847](http://localhost:3847) and you're good to go.

## Tech Stack

| Layer     | Technology                                                                 |
| --------- | -------------------------------------------------------------------------- |
| Framework | [Next.js 15](https://nextjs.org/) (App Router)                             |
| UI        | [React 19](https://react.dev/)                                             |
| Language  | [TypeScript](https://www.typescriptlang.org/)                              |
| Database  | [Redis](https://redis.io/) via [ioredis](https://github.com/redis/ioredis) |
| Real-time | Server-Sent Events (SSE)                                                   |
| Styling   | CSS (global stylesheet)                                                    |
| Hosting   | [Vercel](https://vercel.com/)                                              |

## Project Structure

```
team-mood/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── mood/[code]/       # POST mood votes
│   │   │   ├── session/           # POST create session
│   │   │   │   └── [code]/        # GET session info
│   │   │   └── stream/[code]/     # GET SSE stream
│   │   ├── session/[code]/        # Join session page
│   │   │   └── dashboard/         # Live dashboard page
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Landing page
│   │   └── globals.css
│   ├── lib/
│   │   └── constants.ts           # Moods, TTLs, Redis keys
│   └── __tests__/                 # Unit + UI tests
├── e2e/                           # Playwright E2E tests
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

## Testing

Team Mood uses [Vitest](https://vitest.dev/) for unit and component tests, and [Playwright](https://playwright.dev/) for end-to-end tests.

```bash
# Run unit + component tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run everything
npm run test:all
```

## Deploy

### Vercel (Recommended)

```bash
# Set your Redis URL
vercel env add REDIS_URL production

# Deploy
vercel --yes --prod
```

**Verify the deploy:**

```bash
curl -X POST https://<your-domain>/api/session
# → {"code":"A1B2C3"}
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with caffeine and good vibes.

</div>
