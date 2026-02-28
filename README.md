# BoxdBlend

BoxdBlend is a React + Vite web app that compares two Letterboxd exports and generates a cinematic compatibility report.

## What it does

- Compares two users’ watched/rated data
- Calculates a `Blend Score` with a multi-factor algorithm
- Shows card-based insights, including:
	- Shared films and overlap rate
	- Most agreed / biggest rating clashes
	- Watch-next recommendations
	- Most rewatched films
	- Rating generosity gap
	- Recently watched (from `diary.csv`)
	- 2026 watch count (from `diary.csv`)
	- Era preferences
	- Share tab for copy/share text

## Data source

Use your Letterboxd data export from:

- `letterboxd.com/settings/data`

Best input is the full `.zip` export. The app reads:

- `watched.csv`
- `ratings.csv`
- `diary.csv`

## Tech stack

- React 19
- Vite 8
- Plain CSS (single style string in `src/styles.js`)
- Local storage session layer via `src/storage.js`

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Usage flow

1. Person A clicks **Start a Blend** and uploads data
2. App generates a 6-character code
3. Person B clicks **Join a Blend**, enters code, uploads data
4. Results are generated and shown in card carousel
5. Use the **Share** card to copy/share summary text

## Notes

- Sessions are stored in browser storage, not a backend database
- For newest features (e.g., recent diary entries, rewatch counts), create a fresh blend instead of reusing old stored sessions

## Vercel deployment (important)

For cross-device code sharing in production, this app uses a Vercel Function (`api/storage.js`) backed by **Upstash Redis**.

1. In Vercel dashboard, open your project
2. Go to **Storage / Integrations** → add **Upstash Redis**
3. Ensure Redis environment variables are added to the project
4. Redeploy

Without Redis configured, the app falls back to local browser storage and friend codes will only work in the same browser/device.

## TMDB integration (optional)

The **Most Niche vs Most Popular** card can use real popularity data from TMDB.

1. Create a TMDB API key at `themoviedb.org`
2. In Vercel project settings, add environment variable:
	- `TMDB_API_KEY=your_key_here`
3. Redeploy

If `TMDB_API_KEY` is missing, the card falls back to local heuristics.

The TMDB API route includes a built-in outbound throttle capped at 40 calls/second per server instance (below TMDB's 50/sec requirement).

## Project structure

- `src/App.jsx` — app flow, session handling
- `src/FileUploader.jsx` — zip/csv ingest and parsing pipeline
- `src/analysis.js` — blend scoring + insights
- `src/ResultsView.jsx` — card carousel
- `src/ResultCards.jsx` — result card UI components
- `src/csv.js` — CSV parser and film shape transforms
- `src/storage.js` — browser storage wrapper

## License

Private project.