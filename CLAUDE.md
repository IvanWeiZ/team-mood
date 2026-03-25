# Team Mood

## Dev

```bash
npm run dev        # http://localhost:3847
npx next build     # must pass clean before deploy
```

## Deploy

```bash
vercel env add REDIS_URL production   # set before first deploy
vercel --yes --prod
```

After deploy, verify: `curl -X POST https://<url>/api/session` should return `{"code":"..."}`.
