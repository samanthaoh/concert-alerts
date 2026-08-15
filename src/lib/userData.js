import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from './firebase'

const DEFAULTS = {
  watchlist: [],
  alert_email: '',
  city_name: '',
  latlong: '',
  radius_miles: 60,
}

export async function ensureUserDoc(uid, fallbackEmail) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    const initial = { ...DEFAULTS, alert_email: fallbackEmail || '' }
    await setDoc(ref, initial)
    return initial
  }
  return snap.data()
}

export async function updateUserSettings(uid, settings) {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, settings)
}

export async function addArtist(uid, currentWatchlist, artistName) {
  const trimmed = artistName.trim()
  if (!trimmed) return currentWatchlist
  if (currentWatchlist.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
    return currentWatchlist
  }
  const updated = [...currentWatchlist, trimmed]
  await updateUserSettings(uid, { watchlist: updated })
  return updated
}

export async function removeArtist(uid, currentWatchlist, artistName) {
  const updated = currentWatchlist.filter((a) => a !== artistName)
  await updateUserSettings(uid, { watchlist: updated })
  return updated
}

// Live-subscribes to this user's found-events subcollection (written by the
// GitHub Action's Firebase Admin script, not by the client).
export function subscribeToSeenEvents(uid, callback) {
  const eventsRef = collection(db, 'users', uid, 'seen_events')
  const q = query(eventsRef, orderBy('found_at', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}
