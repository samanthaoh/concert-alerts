import { useEffect, useState } from 'react'
<<<<<<< HEAD
import Login from './components/Login'
import SettingsPanel from './components/SettingsPanel'
import WatchlistEditor from './components/WatchlistEditor'
import AlertFeed from './components/AlertFeed'
import { watchAuthState, logOut } from './lib/authHelpers'
import { ensureUserDoc, subscribeToSeenEvents } from './lib/userData'
import './styles.css'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = still checking, null = signed out
  const [settings, setSettings] = useState(null)
  const [foundEvents, setFoundEvents] = useState([])

  useEffect(() => {
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const data = await ensureUserDoc(firebaseUser.uid, firebaseUser.email)
        setSettings(data)
      } else {
        setSettings(null)
        setFoundEvents([])
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToSeenEvents(user.uid, setFoundEvents)
    return unsubscribe
  }, [user])

  if (user === undefined) {
    return (
      <div className="app">
        <div className="empty-state">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <div className="app-header">
          <h1>Concert Alerts</h1>
          <p className="subtitle">never miss an announcement again</p>
        </div>
        <Login />
      </div>
    )
  }

=======
import Watchlist from './components/Watchlist'
import AlertFeed from './components/AlertFeed'
import { fetchWatchlist, fetchSeenEvents } from './lib/data'
import './styles.css'

export default function App() {
  const [artists, setArtists] = useState([])
  const [foundEvents, setFoundEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [watchlist, events] = await Promise.all([fetchWatchlist(), fetchSeenEvents()])
      setArtists(watchlist)
      setFoundEvents(events)
      setLoading(false)
    }
    load()
  }, [])

>>>>>>> 4ff613d086833c23174acc3de9d09da7621555ec
  return (
    <div className="app">
      <div className="app-header">
        <h1>Concert Alerts</h1>
<<<<<<< HEAD
        <p className="subtitle">signed in as {user.email}</p>
      </div>
      <button className="signout-btn" onClick={logOut}>
        Sign out
      </button>

      {settings && (
        <>
          <div className="section-label">Alert settings</div>
          <SettingsPanel
            uid={user.uid}
            settings={settings}
            onUpdate={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          />

          <div className="section-label">Watching ({settings.watchlist.length})</div>
          <WatchlistEditor
            uid={user.uid}
            watchlist={settings.watchlist}
            foundEvents={foundEvents}
            onUpdate={(updated) => setSettings((prev) => ({ ...prev, watchlist: updated }))}
          />

          <div className="section-label">Recent finds</div>
          <AlertFeed events={foundEvents} />
        </>
      )}
=======
        <p className="subtitle">never miss an announcement again</p>
      </div>
      <p className="data-note">
        edit <code>data/watchlist.json</code> to add or remove artists
      </p>

      <div className="section-label">Watching ({artists.length})</div>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <Watchlist artists={artists} foundEvents={foundEvents} />
      )}

      <div className="section-label">Recent finds</div>
      <AlertFeed events={foundEvents} />
>>>>>>> 4ff613d086833c23174acc3de9d09da7621555ec
    </div>
  )
}
