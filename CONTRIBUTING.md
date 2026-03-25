# Contributing to Team Mood

Thanks for your interest in contributing! Team Mood is a real-time anonymous mood feedback app built with Next.js 15, React 19, and Redis.

## Development Setup

1. **Fork and clone** the repository:

   ```bash
   git clone https://github.com/<your-username>/team-mood.git
   cd team-mood
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables** — create a `.env.local` file:

   ```
   REDIS_URL=redis://localhost:6379
   ```

   You need a running Redis instance. Use a local install, Docker, or a hosted provider like Upstash.

4. **Start the dev server**:

   ```bash
   npm run dev
   ```

   The app runs at [http://localhost:3847](http://localhost:3847).

## Running Tests

```bash
npm test           # Unit tests (Vitest)
npm run test:e2e   # End-to-end tests (Playwright)
```

Make sure all tests pass before submitting a PR.

## Code Style

- **TypeScript** with strict mode enabled
- **Plain CSS** — no Tailwind or CSS-in-JS
- Keep components small and focused
- Use clear, descriptive names for variables and functions

## Submitting Changes

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes and add tests for new functionality.

3. Ensure all tests pass and the build succeeds:

   ```bash
   npx next build
   npm test
   ```

4. Push your branch and open a Pull Request against `main`.

5. Fill out the PR template and wait for review.

## Reporting Bugs

Use [GitHub Issues](../../issues) to report bugs. Please include:

- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, browser, Node version)

## Suggesting Features

Open a [Feature Request](../../issues/new?template=feature_request.md) issue. Describe the problem you're solving and your proposed solution.

## Code of Conduct

Be respectful and constructive. We're all here to build something useful together.
