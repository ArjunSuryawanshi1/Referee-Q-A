# Soccer Center Referee Q&A Training Quiz

A local IFAB 2026/27 center-referee training quiz. The app generates 10-question rounds with realistic match scenarios, immediate feedback, adaptive weak-area review, and local progress persistence.

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env` and add your OpenAI API key.

3. Start the app:

   ```bash
   pnpm dev
   ```

4. Open `http://localhost:5173`.

If `OPENAI_API_KEY` is missing, the app uses a small built-in fallback round so the UI can still be tried locally.

## Scripts

- `pnpm dev` starts the Vite app and local AI proxy.
- `pnpm test` runs validator, progress, and UI tests.
- `pnpm build` type-checks and builds the app.
