# Ethos

Ethos is a Next.js fitness app with:

- detailed onboarding and profile-driven personalization
- workout generation
- nutrition tracking and saved meal plans
- buddy matching
- health-stats import from screenshots
- barcode lookup for packaged food nutrition

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in real values:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment variables

Client-side Firebase config:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Server-side AI config:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` optional, defaults to `gemini-2.5-flash`

Firebase Admin config:

- `FIREBASE_SERVICE_ACCOUNT_PATH` for local development with a JSON key on disk
- `FIREBASE_SERVICE_ACCOUNT_JSON` for deployments where you inject the full JSON as a secret
- `FIREBASE_STORAGE_BUCKET` optional, defaults to `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

Important:

- Do not expose Gemini through `NEXT_PUBLIC_*` in production.
- The app now calls Gemini only through server routes.
- Set only one of `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`.
- On Vercel, prefer `FIREBASE_SERVICE_ACCOUNT_JSON`; absolute local paths will not exist there.

## Vercel deployment

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. In Vercel Project Settings -> Environment Variables, add all values from `.env.example`.
4. Redeploy after adding env vars.

Recommended checks before deploy:

```bash
npm test
npm run lint
npm run build
```

## Production notes

- Nutrition AI routes run server-side under `app/api/*`.
- Barcode lookup uses Open Food Facts from `app/api/nutrition/barcode`.
- Barcode camera scanning uses the browser `BarcodeDetector` API when available.
- Manual barcode entry remains available on browsers without direct scan support.
- Firebase web config is public by design, but Gemini must stay server-side.

## Main routes

- `/auth`
- `/dev/main`
- `/dev/profile`
- `/dev/train/workout`
- `/dev/nutrition`
- `/dev/find_a_buddy/feed`
- `/dev/stats/import`
