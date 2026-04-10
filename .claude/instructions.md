## Next.js 15 gotchas

- Route handler params are **Promises** — must `await params`
- Client components use `React.use(params)` to unwrap
- CSS imports need `declare module '*.css'` in `src/global.d.ts`
- `next-env.d.ts` must exist at project root
- TypeScript devDeps required: `typescript`, `@types/react`, `@types/node`, `@types/react-dom`

## Redis

Connection string (put in `.env.local`):

```
REDIS_URL="<your-redis-connection-string>"
```

- Use `ioredis` (not `redis` npm package) — singleton pattern with HMR guard
- Keys: `session:{code}`, `mood:{code}`, `comments:{code}`
- Sessions expire after 24h via Redis TTL
- All mood operations use atomic Redis commands (HINCRBY)

## Common pitfalls (avoid getting stuck)

- **Port 3847**: Dev server runs on port 3847, not default 3000. Set in `package.json` scripts.
- **`next-env.d.ts`**: Must exist at project root or build fails. Create it with: `/// <reference types="next" />`
- **`src/global.d.ts`**: Must declare CSS modules (`declare module '*.css'`) or TS will error on CSS imports
- **Route params in Next.js 15**: They are Promises now. In route handlers: `const { code } = await params`. In client components: `const { code } = React.use(params)`.
- **SSE streaming**: Use `ReadableStream` with `TextEncoder`, set headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- **Redis client in dev**: Attach to `globalThis` to survive HMR reloads, or you'll leak connections
- **Vercel env vars**: `REDIS_URL` must be set via `vercel env add` before deploy, not just in `.env.local`
- **Build before deploy**: Always run `npx next build` locally to catch TS errors before `vercel --prod`
- **No Tailwind**: This project uses plain CSS with a dark glassmorphism theme. Do not install or use Tailwind.
