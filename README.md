# Hearth · Household Finances

A private budgeting app for your family — budget vs. goals, debt tracking, CSV import,
and a categorizer that learns your merchants.

It runs in **two modes** from the same code:

- **Local-only** (no setup): data lives in the browser on one device.
- **Cloud sync** (add Supabase keys): real logins + a shared **household**. You and Shannon each
  have your own account but see and edit **one** shared budget, synced across every device and
  safe from browser cleanup. *This is the recommended setup and what the steps below turn on.*

---

## 1. Run it on your computer

You need [Node.js](https://nodejs.org) 18+.

```bash
npm install      # one time
npm run dev      # http://localhost:5173
```

Without any keys it works immediately in local-only mode, so you can try it first.

---

## 2. Turn on cloud sync (Supabase — free)

### a. Create the project
1. Go to **https://supabase.com**, sign up, and create a **New project**.
   Pick a strong database password and a region near you. (Free tier is fine.)

### b. Create the table + security rules
2. In your project: **SQL Editor -> New query**. Open the included **`supabase_setup.sql`**,
   paste its contents, and click **Run**. This creates a `budgets` table and the
   row-level-security policies that ensure each account can read only its own data.

### c. (Recommended for easy testing) instant signups
3. By default Supabase emails a confirmation link on signup. For a private family app you can
   skip that wait: **Authentication -> Providers -> Email ->** turn **off** "Confirm email", Save.
   (Leave it on if you prefer email confirmation.)

### d. Get your keys
4. **Project Settings -> API.** Copy the **Project URL** and the **anon public** key.
   > The anon key is meant to live in the browser — your data is protected by the
   > row-level-security rules from step b, not by hiding this key.

### e. Add the keys locally
5. Copy `.env.example` to `.env` and paste your values:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```
6. Restart `npm run dev`. You'll get a **sign-in screen** — create an account.
7. First time in, you'll **set up a household**: choose **Create a new household**. You're now synced.
   (If you used local-only mode first, that data is pushed up to your household automatically.)

---

## 3. Deploy it free (Vercel)

### Option A — Vercel + GitHub (recommended for cloud sync)
1. Put this folder in a new GitHub repo (private is fine).
2. **vercel.com -> Add New -> Project -> Import** your repo. Framework preset: **Vite** (auto-detected).
3. Before deploying, open **Environment Variables** and add the same two keys:
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Then **Deploy**.
4. You get a free URL like `https://hearth-finances-xxxx.vercel.app`. Pushes auto-redeploy.

### Option B — Vercel CLI
```bash
npm install -g vercel
vercel              # answer prompts; it auto-detects Vite
# add env vars:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod       # redeploy with the keys
```

### Option C — local-only, zero backend
Skip Supabase entirely. Run `npm run build` and drag the **`dist`** folder onto
**https://app.netlify.com/drop**. Data stays in that browser (no login, no sync).

---

## Sharing one budget with Shannon (the household model)

You each keep your **own** login, and both see/edit the **same** budget:

1. You create the household (step 7 above).
2. Open the **Data** tab — you'll see an **invite code** for your household. Copy it.
3. Shannon opens the site, **creates her own account**, and on the household screen chooses
   **Join with an invite code** and enters yours.
4. Done — you're both in the same household. Any change either of you makes syncs to the other
   (instantly if you enabled realtime, otherwise when the other device is reopened/refocused).

You can regenerate the invite code anytime from the Data tab (the old one stops working), and
either person can leave the household there too.

Sync is last-write-wins on the whole budget, so avoid editing the exact same thing on two devices
at the same moment while offline.

---

## The free domain & cost

The `*.vercel.app` (or `*.netlify.app`) subdomain is free forever for a personal app. A custom
domain like `hearthfinances.com` is optional (~$10-15/year for the domain; hosting stays free).
Supabase's free tier comfortably covers a household's usage.

---

## What's in this folder

```
hearth-finances/
├── index.html              # page shell
├── package.json            # dependencies + scripts
├── vite.config.js          # build config
├── .env.example            # copy to .env and add your Supabase keys
├── supabase_setup.sql      # run once in Supabase (households, members, budget + security)
├── src/
│   ├── main.jsx            # mounts the app
│   ├── supabase.js         # Supabase client (null -> local-only mode)
│   └── App.jsx             # the entire application
├── dist/                   # prebuilt files (for Netlify Drop / local-only)
└── README.md               # this file
```

Built with React + Vite. Backup/restore (a single JSON file) is always available on the
**Data** tab, in either mode.
# hearth
