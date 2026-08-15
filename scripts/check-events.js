// Runs daily via .github/workflows/check-events.yml
<<<<<<< HEAD
// Loops through every user document in Firestore, checks Ticketmaster's
// Discovery API for each artist on their watchlist (using their own
// city/radius), writes new finds to that user's seen_events subcollection,
// and emails them via Resend.
//
// Required env vars (set as GitHub repo secrets):
//   FIREBASE_SERVICE_ACCOUNT   (base64-encoded service account JSON)
//   TICKETMASTER_API_KEY
//   RESEND_API_KEY
//   ALERT_EMAIL_FROM           (must be a Resend-verified sender)

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM

const serviceAccountJson = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT,
  'base64'
).toString('utf-8')
const serviceAccount = JSON.parse(serviceAccountJson)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function fetchEventsForArtist(artistName, latlong, radiusMiles) {
  const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json')
  url.searchParams.set('apikey', TICKETMASTER_API_KEY)
  url.searchParams.set('keyword', artistName)
  url.searchParams.set('latlong', latlong)
  url.searchParams.set('radius', String(radiusMiles))
=======
// Reads data/watchlist.json, checks Ticketmaster's Discovery API for each
// artist, diffs against data/seen_events.json, writes any new finds back to
// disk (the workflow commits the change), and emails an alert via Resend.
//
// Required env vars (set as GitHub repo secrets):
//   TICKETMASTER_API_KEY
//   RESEND_API_KEY
//   ALERT_EMAIL_TO
//   ALERT_EMAIL_FROM   (must be a Resend-verified sender, or use their test domain)

import { readFile, writeFile } from 'fs/promises'

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO
const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM

// Adjust to wherever you want to catch shows — Seattle by default.
const GEO = { latlong: '47.6062,-122.3321', radiusMiles: 60 }

const WATCHLIST_PATH = new URL('../data/watchlist.json', import.meta.url)
const SEEN_EVENTS_PATH = new URL('../data/seen_events.json', import.meta.url)

async function fetchEventsForArtist(artistName) {
  const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json')
  url.searchParams.set('apikey', TICKETMASTER_API_KEY)
  url.searchParams.set('keyword', artistName)
  url.searchParams.set('latlong', GEO.latlong)
  url.searchParams.set('radius', String(GEO.radiusMiles))
>>>>>>> 4ff613d086833c23174acc3de9d09da7621555ec
  url.searchParams.set('unit', 'miles')
  url.searchParams.set('sort', 'date,asc')

  const res = await fetch(url.toString())
  if (!res.ok) {
    console.error(`Ticketmaster request failed for ${artistName}: ${res.status}`)
    return []
  }
  const data = await res.json()
  const events = data._embedded?.events ?? []

  return events.map((e) => ({
    id: e.id,
    artist: artistName,
    name: e.name,
    venue: e._embedded?.venues?.[0]?.name ?? 'TBA',
    city: e._embedded?.venues?.[0]?.city?.name ?? 'TBA',
    date: e.dates?.start?.localDate ?? null,
    presale_date: e.sales?.presales?.[0]?.startDateTime ?? null,
    url: e.url,
  }))
}

<<<<<<< HEAD
async function sendAlertEmail(toEmail, event) {
  if (!RESEND_API_KEY || !ALERT_EMAIL_FROM || !toEmail) {
    console.log('Missing email config or user has no alert_email — skipping send.')
=======
async function sendAlertEmail(event) {
  if (!RESEND_API_KEY || !ALERT_EMAIL_TO || !ALERT_EMAIL_FROM) {
    console.log('Email env vars not set — skipping email, but event was still saved.')
>>>>>>> 4ff613d086833c23174acc3de9d09da7621555ec
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: ALERT_EMAIL_FROM,
<<<<<<< HEAD
      to: toEmail,
=======
      to: ALERT_EMAIL_TO,
>>>>>>> 4ff613d086833c23174acc3de9d09da7621555ec
      subject: `🎟️ ${event.artist} just announced a show`,
      html: `
        <p><strong>${event.artist}</strong> is playing <strong>${event.venue}</strong>, ${event.city}.</p>
        <p>Show date: ${event.date ?? 'TBA'}</p>
        ${event.presale_date ? `<p>Presale opens: ${event.presale_date}</p>` : ''}
        <p><a href="${event.url}">View on Ticketmaster</a></p>
      `,
    }),
  })
  if (!res.ok) {
    console.error(`Resend send failed: ${res.status} ${await res.text()}`)
  }
}

<<<<<<< HEAD
async function processUser(userDoc) {
  const user = userDoc.data()
  const uid = userDoc.id

  if (!user.watchlist || user.watchlist.length === 0) return
  if (!user.latlong) {
    console.log(`Skipping ${uid} — no city set yet`)
    return
  }

  const seenEventsRef = db.collection('users').doc(uid).collection('seen_events')
  const seenSnapshot = await seenEventsRef.get()
  const seenIds = new Set(seenSnapshot.docs.map((d) => d.id))

  for (const artistName of user.watchlist) {
    const events = await fetchEventsForArtist(
      artistName,
      user.latlong,
      user.radius_miles || 60
    )
=======
async function main() {
  if (!TICKETMASTER_API_KEY) {
    throw new Error('TICKETMASTER_API_KEY is not set')
  }

  const watchlist = JSON.parse(await readFile(WATCHLIST_PATH, 'utf-8'))
  const seenEvents = JSON.parse(await readFile(SEEN_EVENTS_PATH, 'utf-8'))
  const seenIds = new Set(seenEvents.map((e) => e.id))

  let newCount = 0

  for (const artistName of watchlist) {
    const events = await fetchEventsForArtist(artistName)
>>>>>>> 4ff613d086833c23174acc3de9d09da7621555ec

    for (const event of events) {
      if (seenIds.has(event.id)) continue

<<<<<<< HEAD
      await seenEventsRef.doc(event.id).set({
        ...event,
        found_at: FieldValue.serverTimestamp(),
      })
      seenIds.add(event.id)

      await sendAlertEmail(user.alert_email, event)
      console.log(`[${uid}] New show found: ${event.artist} @ ${event.venue}, ${event.city}`)
    }
  }
}

async function main() {
  if (!TICKETMASTER_API_KEY) throw new Error('TICKETMASTER_API_KEY is not set')

  const usersSnapshot = await db.collection('users').get()
  console.log(`Checking ${usersSnapshot.size} user(s)...`)

  for (const userDoc of usersSnapshot.docs) {
    await processUser(userDoc)
  }

  console.log('Done.')
=======
      seenEvents.push({ ...event, found_at: new Date().toISOString() })
      seenIds.add(event.id)
      newCount += 1

      await sendAlertEmail(event)
      console.log(`New show found: ${event.artist} @ ${event.venue}, ${event.city}`)
    }
  }

  if (newCount > 0) {
    await writeFile(SEEN_EVENTS_PATH, JSON.stringify(seenEvents, null, 2) + '\n')
    console.log(`Wrote ${newCount} new event(s) to seen_events.json`)
  } else {
    console.log('No new events found today.')
  }
>>>>>>> 4ff613d086833c23174acc3de9d09da7621555ec
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
