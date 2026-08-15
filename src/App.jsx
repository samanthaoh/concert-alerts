import { useEffect, useState } from 'react'
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

  return (
    <div className="app">
      <div className="app-header">
        <h1>Concert Alerts</h1>
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
    </div>
  )
}
