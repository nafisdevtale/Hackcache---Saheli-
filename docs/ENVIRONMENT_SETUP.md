# Local environment variables

## Create your private local file

1. In your local repository root, copy `.env.local.example` to `.env.local`.
2. Open `.env.local` in your editor and paste your own credentials after the appropriate `=`.
3. Restart the development server after changing values.

```bash
cp .env.local.example .env.local
code .env.local
```

The tracked `.env.local.example` contains blank placeholders only. **Do not create or commit a real `.env.local` file on GitHub.** Create it on your own device; the repository's `.gitignore` ignores `.env` and `.env.*`.

## Variables in the template

- `GEMINI_API_KEY` or `AI_API_KEY`: optional server-side Gemini/AI provider credential.
- `SERPAPI_API_KEY`: intended for FLASH menstrual self-care product search. Get a key at https://serpapi.com/manage-api-key.
- `TMDB_API_TOKEN` or `TMDB_API_KEY`, and `WATCHMODE_API_KEY`: optional movie/streaming metadata integrations for INSTINCT.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: optional server-side community/database integration. Treat the service-role key as highly sensitive. Only set `SUPABASE_ANON_KEY` if the implementation specifically requires it.
- `MODERATOR_SECRET` and `SAHELI_MAINTAINER_KEY`: server-only moderation/administration secrets. Generate strong unique values if the corresponding routes are used.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`: optional push and scheduled-task configuration.

Core local features such as cycle tracking, app lock, and file imports do not require third-party API keys. Partner Connect remote sync is not configured by these variables.

## Important implementation note

A variable in this template does not prove the associated integration is implemented or enabled. In particular, FLASH needs server-side code that reads `process.env.SERPAPI_API_KEY`, calls SerpApi, filters results to menstrual self-care products, and handles errors and rate limits before it can use live shopping listings. Confirm each integration's server handler before adding credentials.

Never prefix secrets with `VITE_`, because Vite exposes `VITE_*` variables to browser code. Never put real credentials in source files, docs, screenshots, issues, or commits. If a real key was ever committed or shared publicly, revoke or rotate it with the provider.
