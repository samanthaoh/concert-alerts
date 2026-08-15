export default function Watchlist({ artists, foundEvents }) {
  if (artists.length === 0) {
    return (
      <div className="empty-state">
        No artists yet — add names to <code>data/watchlist.json</code> and push.
      </div>
    )
  }

  return (
    <div className="stub-list">
      {artists.map((name) => {
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
          </div>
        )
      })}
    </div>
  )
}
