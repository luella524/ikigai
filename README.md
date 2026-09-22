# Ikigai

Compare your current role with the role you want. See your alignment. Choose your next move.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Put the AIHubMix key in `.env.local`:

```text
AIHUBMIX_API_KEY=sk-...
```

Restart `npm run dev` after saving the file. The key stays on the server. The browser only calls `POST /api/analyze`.

`AIHUBMIX_BASE_URL` and `AIHUBMIX_JEV_MODEL` are optional. They default to `https://aihubmix.com` and `jev-latest`.

## Local mock mode

With no `AIHUBMIX_API_KEY`, `npm run dev` still runs the full flow and returns a stable local score. The same answers always produce the same numbers. Mock scoring lives in `lib/mock-evaluation.ts`.

A production server without a key returns a configuration error instead of the mock.

## AIHubMix Run JEV

Live calls are in `lib/aihubmix.ts`. They follow the official decision endpoint:

`POST https://aihubmix.com/v1/systemone`

Contract: [jev-latest llms.txt](https://aihubmix.com/model/jev-latest/llms.txt).

The request scores eight role questions only: `current_love`, `current_strength`, `current_impact`, `current_paid`, and the matching `ideal_*` ids. Each question names only that role and uses the Ikigai the user defined. JEV does not return an overall score, and this MVP does not call JEV Choice. Each dimension is one of five bands: 10, 30, 50, 70, or 90. Ikigai Fit is the weighted average of those bands, rounded to the nearest 5. The Ikigai Gap is ideal fit minus current fit.
