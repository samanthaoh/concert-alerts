import { useState } from 'react'
import { geocodeCity } from '../lib/geocode'
import { updateUserSettings } from '../lib/userData'

export default function SettingsPanel({ uid, settings, onUpdate }) {
  const [cityInput, setCityInput] = useState(settings.city_name || '')
  const [radius, setRadius] = useState(settings.radius_miles || 60)
  const [emailInput, setEmailInput] = useState(settings.alert_email || '')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSaveCity(e) {
    e.preventDefault()
    setStatus('')
    setSaving(true)
    try {
      const geo = await geocodeCity(cityInput)
      const latlong = `${geo.lat},${geo.lon}`
      await updateUserSettings(uid, {
        city_name: cityInput,
        latlong,
        radius_miles: Number(radius),
      })
      onUpdate({ city_name: cityInput, latlong, radius_miles: Number(radius) })
      setStatus(`Saved — matched to ${geo.display_name}`)
    } catch (err) {
      setStatus(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEmail(e) {
    e.preventDefault()
    await updateUserSettings(uid, { alert_email: emailInput })
    onUpdate({ alert_email: emailInput })
    setStatus('Alert email saved')
  }

  return (
    <div className="settings-panel">
      <form onSubmit={handleSaveCity} className="settings-row">
        <input
          type="text"
          placeholder="City (e.g. Seattle, WA)"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
        />
        <input
          type="number"
          placeholder="Radius (mi)"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          min={5}
          max={300}
          className="radius-input"
        />
        <button type="submit" disabled={saving}>
          Save
        </button>
      </form>

      <form onSubmit={handleSaveEmail} className="settings-row">
        <input
          type="email"
          placeholder="Alert email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
        />
        <button type="submit">Save</button>
      </form>

      {status && <p className="settings-status">{status}</p>}
    </div>
  )
}
