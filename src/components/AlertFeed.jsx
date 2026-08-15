function formatDate(dateStr) {
  if (!dateStr) return 'TBA'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AlertFeed({ events }) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        No announcements caught yet. Once the GitHub Action has run at least once,
        new shows for your watched artists will show up here.
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => new Date(b.found_at) - new Date(a.found_at))

  return (
    <div>
      {sorted.map((event) => (
        <div className="alert-item" key={event.id}>
          <p className="headline">
            {event.artist} · {event.venue}, {event.city}
          </p>
          <span className="meta">
            Show: {formatDate(event.date)}
            {event.presale_date && ` · Presale opens ${formatDate(event.presale_date)}`}
            {' · '}
            <a href={event.url} target="_blank" rel="noreferrer">
              Tickets
            </a>
          </span>
        </div>
      ))}
    </div>
  )
}
