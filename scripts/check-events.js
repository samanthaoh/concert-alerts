// Runs daily via .github/workflows/check-events.yml
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

async function sendAlertEmail(toEmail, event) {
  if (!RESEND_API_KEY || !ALERT_EMAIL_FROM || !toEmail) {
    console.log('Missing email config or user has no alert_email — skipping send.')
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
      to: toEmail,
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

    for (const event of events) {
      if (seenIds.has(event.id)) continue

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
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
