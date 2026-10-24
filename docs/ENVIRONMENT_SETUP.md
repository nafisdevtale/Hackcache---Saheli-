# Local environment variables

## Set up your own keys

1. In the repository root, copy `.env.local.example` to `.env.local`.
2. Open `.env.local` in your editor and paste your own API keys between the `=` signs.
3. Restart the development server after changing environment variables.

Example:

```dotenv
SERPAPI_API_KEY=your_actual_key_here
```

Do not paste actual keys into this documentation, source files, client-side code, screenshots, issues, or commits.

## Product search (FLASH)

Create a SerpApi account and retrieve the key from https://serpapi.com/manage-api-key. Set `SERPAPI_API_KEY` in `.env.local`.

The key must only be used by server-side code. Never prefix it with `VITE_`, since Vite exposes `VITE_*` variables to browser code.

**Important:** this commit provides a safe place to store the key locally. It does not by itself implement or enable a SerpApi-backed product recommendation endpoint; the backend must read `process.env.SERPAPI_API_KEY` and call SerpApi before FLASH can use live listings.

## Other optional services

Only fill in credentials for integrations you actually use. Blank values should leave optional services disabled. Do not place production secrets in GitHub repository files. Configure deployed environment variables in the hosting provider's environment/secrets settings instead.

## Git safety

The repository's `.gitignore` ignores `.env` and `.env.*`, while allowing `.env.example`. Keep the real `.env.local` file untracked. If a real key was ever committed or shared publicly, revoke/rotate it at the provider.
