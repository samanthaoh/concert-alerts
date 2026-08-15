// Uses OpenStreetMap's free Nominatim geocoder — no API key, no card.
// Nominatim's usage policy asks for a max of 1 request/sec and a descriptive
// User-Agent, which is fine at this app's scale (one lookup per user, only
// when they change their city).
export async function geocodeCity(cityName) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', cityName)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  const res = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'en' },
  })
  if (!res.ok) throw new Error('Geocoding request failed')

  const results = await res.json()
  if (results.length === 0) throw new Error(`Could not find a location for "${cityName}"`)

  return {
    lat: parseFloat(results[0].lat),
    lon: parseFloat(results[0].lon),
    display_name: results[0].display_name,
  }
}
