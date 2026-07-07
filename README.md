# Marginalia — AI-Assisted Blog

React 18 + Vite + Tailwind + GSAP + Framer Motion frontend, Firebase
(Auth/Firestore/Storage) backend, and a Vercel Serverless Function that
calls OpenRouter (Mistral 7B) so the AI key never reaches the browser.

## 1. Local setup

```bash
npm install
cp .env.example .env
# fill in .env with your real Firebase values (see below)
```

Run the frontend only:
```bash
npm run dev
```

Run frontend **+** the `/api` serverless function together (recommended,
needs the Vercel CLI):
```bash
npm i -g vercel
vercel dev
```
`npm run dev` alone won't hit `/api/generate-blog` — that route only exists
when Vercel's dev server (or a real deploy) is running it.

## 2. Create your Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Build > Authentication** → Sign-in method → enable **Google**.
3. **Build > Authentication > Settings > Authorized domains** → add your Vercel domain (e.g. `your-app.vercel.app`), or Google sign-in will fail with `auth/unauthorized-domain`.
4. **Build > Firestore Database** → Create database → start in production mode.
5. Project settings (gear icon) → General → "Your apps" → add a **Web app** → copy the config values into `.env` as `VITE_FIREBASE_*`.
6. Deploy the included rules so reads/writes are actually locked down:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase init firestore   # point at firestore.rules
   firebase deploy --only firestore:rules
   ```
   No Vercel CLI? Paste `firestore.rules`'s content directly into
   **Firestore Database > Rules** in the console and click Publish instead.

> **No Firebase Storage here on purpose.** Since 2024, new Firebase
> projects need the paid Blaze plan to use Cloud Storage at all — even
> within the free-tier usage limits. This project uses **Cloudinary**
> instead for featured images (see step 3), which has its own generous
> free tier with no billing requirement.

## 3. Set up Cloudinary for image uploads

1. Sign up free at [cloudinary.com](https://cloudinary.com).
2. Dashboard home page shows your **Cloud name**, **API Key**, and **API Secret** — copy all three.
3. Add them to Vercel as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (server-only, see step 6 below).

Uploads are signed server-side in `api/upload-image.js` — the API secret
never reaches the browser, and the frontend (`src/utils/cloudinary.js`)
only ever talks to your own `/api` routes, never Cloudinary directly.

Set `VITE_ADMIN_EMAILS` in `.env` to a comma-separated list of the Google
accounts allowed into `/admin` (e.g. `you@gmail.com`). This is a
**client-side convenience gate**, not real security — see the note at the
top of `firestore.rules` about custom claims if you want the database
itself to enforce it.

## 4. Get an OpenRouter API key

1. Sign up at [openrouter.ai](https://openrouter.ai).
2. Go to **Keys** → Create Key.
3. Copy it — you'll add it to Vercel only, never to `.env` as a `VITE_` var.

## 5. Seed sample data (optional)

```bash
npm install --save-dev firebase-admin
# Firebase Console > Project Settings > Service Accounts > Generate new private key
# save the downloaded file as serviceAccountKey.json in this folder
node seed.js
```

## 6. Deploy to Vercel

```bash
npm i -g vercel
vercel
```
Or connect the GitHub repo at [vercel.com/new](https://vercel.com/new) —
Vercel auto-detects Vite and the `/api` folder.

### Adding environment variables in the Vercel Dashboard

1. Open your project on [vercel.com](https://vercel.com) → **Settings** tab.
2. Click **Environment Variables** in the left sidebar.
3. Add each variable below, one at a time — paste the **Key**, paste the
   **Value**, leave the environment checkboxes on *Production, Preview,
   and Development* (unless you want different keys per environment):

   | Key | Value | Notes |
   |---|---|---|
   | `VITE_FIREBASE_API_KEY` | from Firebase config | public, safe to expose |
   | `VITE_FIREBASE_AUTH_DOMAIN` | from Firebase config | public |
   | `VITE_FIREBASE_PROJECT_ID` | from Firebase config | public |
   | `VITE_FIREBASE_STORAGE_BUCKET` | from Firebase config | public |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | from Firebase config | public |
   | `VITE_FIREBASE_APP_ID` | from Firebase config | public |
   | `VITE_ADMIN_EMAILS` | e.g. `you@gmail.com` | comma-separated |
   | `OPENROUTER_API_KEY` | from OpenRouter dashboard | **no VITE_ prefix — server-only, secret** |
   | `SITE_URL` | your deployed URL | used as the OpenRouter referer header |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard | **no VITE_ prefix — server-only** |
   | `CLOUDINARY_API_KEY` | from Cloudinary dashboard | **no VITE_ prefix — server-only** |
   | `CLOUDINARY_API_SECRET` | from Cloudinary dashboard | **no VITE_ prefix — server-only, secret** |

4. Click **Save** after each one.
5. Go to the **Deployments** tab → click the ⋯ menu on the latest deployment
   → **Redeploy**, so the new env vars actually get picked up (Vercel does
   not hot-reload running deployments when you change env vars).

### Verifying the key never leaks

After deploying, open your live site, view page source / check the built
JS in devtools Network tab, and search for your OpenRouter key and
Cloudinary API secret — neither should appear anywhere. Only
`VITE_`-prefixed variables get bundled into client code; `OPENROUTER_API_KEY`
and `CLOUDINARY_API_SECRET` stay server-side inside their respective
`/api` functions.

## Project structure

```
/api
  generate-blog.js   ← Vercel Serverless Function (OpenRouter proxy)
  upload-image.js    ← Vercel Serverless Function (signed Cloudinary upload)
  delete-image.js    ← Vercel Serverless Function (Cloudinary cleanup)
  package.json       ← axios dependency for the functions
/src
  /components        ← Navbar, Footer, BlogCard, AIGeneratePanel, ProtectedRoute
  /context            ← AuthContext (Firebase Auth), ThemeContext (dark/light)
  /firebase           ← config.js, blogs.js (Firestore CRUD)
  /utils              ← cloudinary.js (frontend upload/delete helpers)
  /pages              ← Home, BlogDetail, Admin, Login, NotFound
vercel.json           ← function config + SPA rewrites
firestore.rules
seed.js               ← sample data loader
.env.example
```

## Notes on the design

Posts written with AI assistance are marked with a clay-colored accent
strip and an "AI-assisted" tag — both on the homepage card and the detail
page — instead of hiding that distinction. It's meant to make the
AI-generation feature part of the reading experience rather than an
invisible backend detail.
