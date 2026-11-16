# Personal Dashboard

One screen for the PT business, personal life and your brother's school work.
Runs only on this PC at **http://127.0.0.1:3100**. No cloud services, no analytics, no trackers.

## What you need

- **Node.js LTS** (v20 or newer) from https://nodejs.org. This is the only thing installed system-wide, and you install it yourself.
- Everything else (`next`, `react`, `tailwindcss`) installs into `dashboard/node_modules`. Nothing is installed globally.

## Start it

**Windows, easiest:** double-click `start-dashboard.bat`. The first run installs dependencies and builds (a minute or two). After that it starts in a couple of seconds and opens your browser.

**Terminal:**

```bash
cd dashboard
npm install
npm run build
npm start          # http://127.0.0.1:3100
```

`npm run dev` runs a development server with live reload on the same address.

Stop it with Ctrl+C in the window, or double-click `stop-dashboard.bat`.

After downloading a new version, just start it again: the launcher (and `npm start`) notices the code changed and rebuilds automatically. Keep your `data` folder when you replace the files.

## Where your data lives

- `dashboard/data/db.json`: everything you enter. Back it up by copying this file.
- `dashboard/data/gmail-token.json`: the Gmail token (only after you connect Gmail).

The whole `data/` folder, `.env*` files and any `*token*.json` are in `.gitignore`, so they never get committed.

Don't store health data, client photos, payment details, bank details or passwords. The app has no fields for them and isn't built to protect them.

## Desktop notifications

Click **Enable desktop notifications** in the top bar once and allow it in the browser prompt. Reminders then pop up as Windows notifications at their set time.

Notifications fire from the open dashboard tab, so keep a tab open (pinning it in Chrome or Edge works well). A reminder missed while the tab was closed pops up the next time you open it, as long as it's under 24 hours old. If nothing appears, check Windows Settings > System > Notifications and that Focus Assist / Do Not Disturb is off.

## Launch on Windows startup (optional)

1. Press **Win + R**, type `shell:startup`, press Enter. A folder opens.
2. Right-click `start-dashboard-hidden.vbs` in the `dashboard` folder > **Show more options** > **Create shortcut**.
3. Move that shortcut into the Startup folder.

On next sign-in the dashboard starts in the background (no console window) and opens in your browser. To undo, delete the shortcut. To stop the background server, run `stop-dashboard.bat`.

## Using it on your phone (off by default)

The normal start command only listens on 127.0.0.1, so nothing else on your network can reach it. To open it from your phone on home Wi-Fi:

```bash
npm run start:lan
```

Then on your phone open `http://<your-PC-IP>:3100` (find the IP with `ipconfig`, the "IPv4 Address" line). Windows Firewall will ask whether to allow Node.js on private networks; allow **Private** only.

There is no login in LAN mode: anyone on the same Wi-Fi can open the dashboard and see the email subjects. Only use it on a network you trust, and go back to `npm start` when you're done. Connect Gmail from the PC itself, not from the phone.

## Gmail (read-only)

The dashboard only ever asks Google for the `gmail.readonly` scope and only makes read requests. It refuses any token that has a broader scope. It shows your unread count and the 10 latest inbox subjects and senders. **Copy for reply** copies one email as plain text (with a "Help me draft a reply" line on top) so you can paste it into Claude yourself.

You create your own Google OAuth credentials, so no third party is involved. You never give the dashboard your password: sign-in happens on Google's own page in your browser.

### 1. Create a Google Cloud project

1. Go to https://console.cloud.google.com/ and sign in with the Gmail account you want to read.
2. Top bar project picker > **New project**. Name it e.g. `Personal Dashboard` > **Create**, then select it.

### 2. Enable the Gmail API

**APIs & Services > Library**, search **Gmail API**, click **Enable**.

### 3. Set up the consent screen

Google's menus call this either **OAuth consent screen** or **Google Auth Platform**.

1. Click **Get started**. App name: `Personal Dashboard`. Support email: your address.
2. Audience: **External**. Contact email: your address. Agree and **Create**.
3. Go to **Audience** > **Test users** > **Add users** and add your own Gmail address.
4. (Optional) **Data access** > **Add or remove scopes**, tick `.../auth/gmail.readonly`, save.

### 4. Create the OAuth client

1. **Clients** (or **APIs & Services > Credentials > Create credentials > OAuth client ID**).
2. Application type: **Desktop app**. Name: `Dashboard`. **Create**.
3. Copy the **Client ID** and **Client secret**. If you download the JSON file, keep it outside the repo.

### 5. Add them to the dashboard

In the `dashboard` folder, copy `.env.example` to `.env.local` and fill it in:

```
GOOGLE_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
PORT=3100
```

`.env.local` is gitignored. Restart the dashboard.

### 6. Connect

On the Today screen click **Connect Gmail**. Your browser goes to Google's sign-in page. Google will warn that it "hasn't verified this app": that's expected, because it's your own app. Click **Continue**, check that the only permission listed is **read your email**, and allow. You land back on the dashboard with your inbox showing.

### Things to know

- **Weekly reconnect while in Testing.** Google expires sign-ins for apps in "Testing" status after 7 days. The panel tells you when to click Connect again. To avoid this, go to **Audience** and click **Publish app**. For a personal app you don't need to submit it for verification; you'll just keep seeing the "unverified app" warning when you connect.
- **Disconnect** (bottom of the email panel) deletes the local token and revokes it with Google. You can also remove access at https://myaccount.google.com/permissions.
- The redirect address is `http://127.0.0.1:3100/api/gmail/callback`. If you change `PORT`, the Desktop-app client still works without changes.

## Privacy and network

- The server binds to 127.0.0.1 unless you run `start:lan`.
- Requests with a foreign `Host` header are rejected (stops DNS-rebinding attacks), and so are writes from other websites' origins.
- Next.js telemetry is switched off by the start scripts.
- No web fonts, CDNs or analytics. The only outbound calls are to Google's OAuth and Gmail endpoints, and only after you connect Gmail. Quick links open in your browser like any other link.

## Project layout

```
app/                 pages (Today, pt, personal, school) and API routes
app/api/db           local JSON data API
app/api/gmail        read-only Gmail
components/          UI, data store, reminder notifier
lib/                 data file, date helpers, Gmail client, Today aggregation
scripts/run.mjs      start/build wrapper (127.0.0.1 binding, telemetry off)
data/                your data (gitignored)
```
