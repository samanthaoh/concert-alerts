import { useState } from 'react'
import { addArtist, removeArtist } from '../lib/userData'

export default function WatchlistEditor({ uid, watchlist, foundEvents, onUpdate }) {
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!input.trim()) return
    setSubmitting(true)
    try {
      const updated = await addArtist(uid, watchlist, input)
      onUpdate(updated)
      setInput('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(name) {
    const updated = await removeArtist(uid, watchlist, name)
    onUpdate(updated)
  }

  return (
    <div>
      <form className="add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add an artist to watch"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={submitting || !input.trim()}>
          Watch
        </button>
      </form>

      {watchlist.length === 0 ? (
        <div className="empty-state">No artists yet — add one above.</div>
      ) : (
        <div className="stub-list">
          {watchlist.map((name) => {
            const match = foundEvents.find((e) => e.artist.toLowerCase() === name.toLowerCase())
            return (
              <div className="stub" key={name}>
                <div className="stub-main">
                  <p className="stub-artist">{name}</p>
                  <span className={`stub-status ${match ? 'found' : ''}`}>
                    {match ? `Show found — ${match.city}` : 'Watching · no shows yet'}
                  </span>
                </div>
                <div className="stub-tear" />
                <div className="stub-action">
                  <button onClick={() => handleRemove(name)}>Remove</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
