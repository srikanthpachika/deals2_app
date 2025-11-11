# Deals2Beat — MVP

Curated deals site with < 50 deals/day, simple admin import, and AdSense placeholders.

## Quick start (local)

```bash
pnpm i # or npm i / yarn
cp .env.example .env.local
# set ADMIN_TOKEN and NEXT_PUBLIC_ADSENSE_CLIENT
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000

## Admin

- Go to `/admin`, click **Unlock with Token**, enter `ADMIN_TOKEN`.
- Paste a product/deal URL and **Fetch Metadata** (scrapes Open Graph).
- Review, edit, and **Save Deal**.
- API enforces **< 50 deals per calendar day** and unique URL constraint.

## Ads

This project ships with an AdSense `<ins>` component. Replace `NEXT_PUBLIC_ADSENSE_CLIENT` in `.env.local` and ad slot IDs in `AdSlot` usages. Read and follow the AdSense program policies.

## Deploy (Vercel)

- Import the repo into Vercel.
- Set environment variables: `DATABASE_URL` (use `file:./dev.db` for hobby or upgrade to Postgres), `ADMIN_TOKEN`, `NEXT_PUBLIC_ADSENSE_CLIENT`.
- Add a cron to pull or insert deals if needed (Vercel Cron hitting `/api/ingest` if you add one).

## Notes

- DB: Prisma + SQLite (simple). Switch to Postgres for production.
- Scraper is minimal (Open Graph). For better imports, add affiliate APIs (Amazon PA API, CJ, Rakuten), RSS, or custom parsers.
- Consider rate limits and robots.txt before crawling sites.
- Add moderation, categories, tags, search, and user voting in next iterations.
```