'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { usePlateIQ } from '@/components/plateiq-state'

const PREFERENCES_KEY = 'plateiq-settings-preferences'

type Preferences = {
  notifications: boolean
  operationalNotifications: boolean
}

const defaultPreferences: Preferences = {
  notifications: true,
  operationalNotifications: true,
}

export default function SettingsPage() {
  const { dispatch } = usePlateIQ()
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [loaded, setLoaded] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          const value = parsed as Partial<Preferences>
          setPreferences({
            notifications: typeof value.notifications === 'boolean' ? value.notifications : true,
            operationalNotifications: typeof value.operationalNotifications === 'boolean' ? value.operationalNotifications : true,
          })
        }
      }
    } catch {
      // Keep defaults if saved preferences are unavailable or malformed.
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
      setSavedMessage('Preferences saved on this device.')
    } catch {
      setSavedMessage('Preferences could not be saved in this browser.')
    }
  }, [preferences, loaded])

  function updatePreference(key: keyof Preferences, value: boolean) {
    setPreferences(current => ({ ...current, [key]: value }))
  }

  return (
    <AppShell>
      <div className="page-body">
        <div className="page-heading">
          <div>
            <div className="eyebrow">WORKSPACE SETTINGS</div>
            <h1>Settings</h1>
            <p>Configure the PlateIQ restaurant workspace.</p>
          </div>
        </div>
        <div className="settings-grid">
          <section className="panel settings-card">
            <h2>Restaurant</h2>
            <p>Jubilee Hills Restaurant · Hyderabad, India</p>
            <h2>Service hours</h2>
            <p>Lunch service · 11:00 AM – 3:00 PM</p>
            <h2>Currency</h2>
            <p>Indian Rupee (₹)</p>
          </section>
          <section className="panel settings-card">
            <h2>Workspace preferences</h2>
            <label className="setting-row">
              <span>Notifications</span>
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={event => updatePreference('notifications', event.target.checked)}
                disabled={!loaded}
              />
            </label>
            <label className="setting-row">
              <span>Operational notifications</span>
              <input
                type="checkbox"
                checked={preferences.operationalNotifications}
                onChange={event => updatePreference('operationalNotifications', event.target.checked)}
                disabled={!loaded}
              />
            </label>
            <p className="muted-copy" role="status" aria-live="polite">
              {loaded ? savedMessage : 'Loading preferences…'}
            </p>
            <button
              className="outline-button"
              onClick={() => {
                if (window.confirm('Reset all PlateIQ application data to the original demo state?')) {
                  dispatch({ type: 'reset-data' })
                }
              }}
            >
              Reset application data
            </button>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
