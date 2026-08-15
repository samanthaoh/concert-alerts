// Runs daily via .github/workflows/check-events.yml
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

async function sendAlertEmail(event) {
  if (!RESEND_API_KEY || !ALERT_EMAIL_TO || !ALERT_EMAIL_FROM) {
    console.log('Email env vars not set — skipping email, but event was still saved.')
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
      to: ALERT_EMAIL_TO,
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

    for (const event of events) {
      if (seenIds.has(event.id)) continue

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
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
