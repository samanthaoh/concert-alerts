import localWatchlist from '../../data/watchlist.json'
import localSeenEvents from '../../data/seen_events.json'

// Fill in once you've pushed this to a GitHub repo, e.g.
// 'https://raw.githubusercontent.com/your-username/concert-alerts/main'
// Leave blank to just use the bundled local JSON files (fine for local dev).
const GITHUB_RAW_BASE = ''

async function fetchJson(path, fallback) {
  if (!GITHUB_RAW_BASE) return fallback
  try {
    const res = await fetch(`${GITHUB_RAW_BASE}/${path}?t=${Date.now()}`)
    if (!res.ok) return fallback
    return await res.json()
  } catch {
    return fallback
  }
}

export function fetchWatchlist() {
  return fetchJson('data/watchlist.json', localWatchlist)
}

export function fetchSeenEvents() {
  return fetchJson('data/seen_events.json', localSeenEvents)
}
