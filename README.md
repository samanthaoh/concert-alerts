# Concert Alerts

Never miss a show announcement (and the presale window that comes with it)
for artists you care about. No Firebase, no credit card, no billing page —
just GitHub Actions + a JSON file in the repo.

## How it works

1. `data/watchlist.json` holds the artists you're tracking — you edit this
   file directly (add a name, commit, push).
2. `.github/workflows/check-events.yml` runs `scripts/check-events.js` once a
   day. That script queries Ticketmaster's Discovery API for each watched
   artist near your chosen location, and diffs results against
   `data/seen_events.json`.
3. Any new show gets appended to `data/seen_events.json` and the workflow
   commits that change back to the repo automatically. It also sends you an
   email via Resend.
4. The frontend (`src/`) just displays what's in those two JSON files.

## Setup

### 1. Push this to a GitHub repo
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create concert-alerts --private --source=. --push
# or create the repo on github.com and add it as a remote manually
```
This can be a private repo — GitHub Actions still runs for free, just with a
~2,000 minute/month cap on private repos (a once-daily job uses maybe 1-2
minutes, so you're nowhere close).

### 2. Ticketmaster API key
You've already got this from developer.ticketmaster.com.

### 3. Resend (email alerts) — free, no card
- Sign up at https://resend.com
- Grab an API key from the dashboard
- For `ALERT_EMAIL_FROM`, you can use Resend's shared test domain while
  developing, or verify your own domain later if you want a cleaner sender
  address

### 4. Add GitHub repo secrets
In your repo: **Settings → Secrets and variables → Actions → New repository
secret**. Add all four:
- `TICKETMASTER_API_KEY`
- `RESEND_API_KEY`
- `ALERT_EMAIL_TO` (your email)
- `ALERT_EMAIL_FROM` (your Resend sender)

No card required anywhere in this flow.

### 5. Test it
Go to the **Actions** tab in your repo → "Check for new concert
announcements" → **Run workflow** to trigger it manually instead of waiting
for the daily schedule. Check the run logs to confirm it found (or didn't
find) events, then check `data/seen_events.json` for a commit if it did.

### 6. Run the frontend locally
```bash
npm install
npm run dev
```
This reads the local `data/` files directly, so you'll see whatever's
already been committed.

### 7. (Optional) Deploy the frontend
GitHub Pages is the free, no-card option:
```bash
npm run build
# then use the gh-pages package, or GitHub's own Pages-from-Actions setup,
# to publish the dist/ folder
```
If you want the deployed page to update automatically as new events get
found (without rebuilding), set `GITHUB_RAW_BASE` in `src/lib/data.js` to
your repo's raw content URL — then it fetches the live JSON at runtime
instead of using the bundled copy.

## Notes
- GitHub Actions scheduled workflows aren't perfectly punctual — expect the
  daily run to fire within a window of the scheduled time, not to the
  minute. Fine for this use case.
- If the repo goes 60 days with zero activity, GitHub auto-disables
  scheduled workflows (you'll get an email warning first). Editing
  `watchlist.json` occasionally keeps it active anyway.

## Next steps once v1 works
- Add SeatGeek as a second data source to cross-check coverage
- Add SMS alerts via Twilio if email alerts get missed (does require a card)
- Add a city/radius filter per artist instead of one global location
