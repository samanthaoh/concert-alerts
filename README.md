# Concert Alerts

Multi-user version: anyone can sign in, build their own watchlist, set their
own city, and get emailed when a watched artist announces a show. No credit
card required anywhere in the setup.

## How it works

- **Firebase Authentication** — email/password or Google sign-in
- **Firestore** — each signed-in user gets a `users/{uid}` document holding
  their watchlist, city, radius, and alert email, plus a `seen_events`
  subcollection of shows already found for them
- **GitHub Actions** — runs `scripts/check-events.js` once a day. It reads
  every user from Firestore (via a service account, using the Firebase
  Admin SDK — this bypasses the security rules that restrict the frontend),
  checks Ticketmaster for each of their watched artists near their chosen
  city, and writes/emails any new finds
- **Frontend** — login screen, then an editable watchlist and settings panel

Firestore + Auth stay on Firebase's free Spark plan (no card) as long as
usage stays under the generous daily quotas, which a personal-scale tool
like this won't come close to. The only reason Firebase ever needed a card
before was running the *scheduler* as a Firebase Cloud Function — since
GitHub Actions handles scheduling instead, that's avoided entirely.

## Setup

### 1. Create a Firebase project
- Go to https://console.firebase.google.com → Add project (stay on the free
  Spark plan — don't upgrade to Blaze, you won't need it)

### 2. Enable Authentication
- Build → Authentication → Get started
- Enable **Email/Password** and **Google** as sign-in providers

### 3. Enable Firestore
- Build → Firestore Database → Create database → start in production mode
- Once created, go to the **Rules** tab and paste in the contents of
  `firestore.rules` from this project, then Publish

### 4. Get your web app config
- Project settings (gear icon) → General → scroll to "Your apps" → Add app
  → Web
- Copy the config values into a `.env` file (see `.env.example`)

### 5. Get a service account key (for the GitHub Action)
- Project settings → Service accounts → Generate new private key
- This downloads a JSON file — **never commit this to the repo**
- Base64-encode it so it can live safely as a single GitHub secret:
  ```bash
  base64 -i path/to/serviceAccountKey.json | tr -d '\n' > encoded.txt
  ```
  (on Linux, `base64 -w 0` does the same thing without the `tr`)

### 6. Ticketmaster + Resend
Same as before — Ticketmaster Discovery API key, Resend account for email
(free, no card).

### 7. Add GitHub repo secrets
Settings → Secrets and variables → Actions → New repository secret:
- `FIREBASE_SERVICE_ACCOUNT` — paste the base64 string from step 5
- `TICKETMASTER_API_KEY`
- `RESEND_API_KEY`
- `ALERT_EMAIL_FROM` — your Resend-verified sender address

Note there's no `ALERT_EMAIL_TO` anymore — that's per-user now, set in the
app itself.

### 8. Run the frontend
```bash
npm install
npm run dev
```
<<<<<<< HEAD
Sign up, add a few artists, set your city — that's what gets checked daily.

### 9. Test the Action
Actions tab → "Check for new concert announcements" → Run workflow, then
check the logs.

## Notes
- Geocoding (turning a typed city name into coordinates) uses OpenStreetMap's
  free Nominatim API — no key needed, but keep lookups light (this app only
  geocodes when a user changes their city, which is fine).
- If you ever want to inspect who's signed up or debug a user's data, the
  Firebase console's Firestore tab shows the raw `users` collection.

## Next steps
- Add SeatGeek as a second data source
- SMS alerts via Twilio (this one does need a card, so treat it as a
  deliberate later upgrade, not part of the free core)
- A "delete my account" flow if this ever goes beyond just you and friends
=======
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
>>>>>>> 4ff613d086833c23174acc3de9d09da7621555ec
