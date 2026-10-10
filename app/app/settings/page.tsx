'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { usePlateIQ } from '@/components/plateiq-state'

const PREFERENCES_KEY = 'plateiq-settings-preferences'

type Preferences = {
  notifications: boolean
  operationalNotifications: boolean
  restaurantName: string
  city: string
  serviceStart: string
  serviceEnd: string
  currency: string
}

const defaultPreferences: Preferences = {
  notifications: true,
  operationalNotifications: true,
  restaurantName: '',
  city: '',
  serviceStart: '',
  serviceEnd: '',
  currency: '',
}

const currencies = [
  { value: 'INR', label: 'Indian Rupee (INR ₹)' },
  { value: 'USD', label: 'US Dollar (USD $)' },
  { value: 'EUR', label: 'Euro (EUR €)' },
  { value: 'GBP', label: 'British Pound (GBP £)' },
  { value: 'AED', label: 'UAE Dirham (AED د.إ)' },
  { value: 'SGD', label: 'Singapore Dollar (SGD S$)' },
]

export default function SettingsPage() {
  const { state, dispatch } = usePlateIQ()
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [loaded, setLoaded] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY)
      const parsed: unknown = saved ? JSON.parse(saved) : null
      const value = parsed && typeof parsed === 'object' ? parsed as Partial<Preferences> : {}
      setPreferences({
        notifications: typeof value.notifications === 'boolean' ? value.notifications : defaultPreferences.notifications,
        operationalNotifications: typeof value.operationalNotifications === 'boolean' ? value.operationalNotifications : defaultPreferences.operationalNotifications,
        restaurantName: typeof value.restaurantName === 'string' ? value.restaurantName : state.restaurant.name,
        city: typeof value.city === 'string' ? value.city : state.restaurant.city,
        serviceStart: typeof value.serviceStart === 'string' ? value.serviceStart : '',
        serviceEnd: typeof value.serviceEnd === 'string' ? value.serviceEnd : '',
        currency: typeof value.currency === 'string' && value.currency ? value.currency : (state.restaurant.currency || 'INR'),
      })
    } catch {
      setPreferences({
        ...defaultPreferences,
        restaurantName: state.restaurant.name,
        city: state.restaurant.city,
        currency: state.restaurant.currency || 'INR',
      })
    } finally {
      setLoaded(true)
    }
  }, [state.restaurant.name, state.restaurant.city, state.restaurant.currency])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
      setSavedMessage('Settings saved on this device.')
    } catch {
      setSavedMessage('Settings could not be saved in this browser.')
    }
  }, [preferences, loaded])

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences(current => ({ ...current, [key]: value }))
  }

  return (
    <AppShell>
      <div className="page-body">
        <div className="page-heading">
          <div>
            <div className="eyebrow">WORKSPACE SETTINGS</div>
            <h1>Settings</h1>
            <p>Manage restaurant details and workspace preferences.</p>
          </div>
        </div>
        <div className="settings-grid">
          <section className="panel settings-card">
            <h2>Restaurant details</h2>
            <label className="setting-field">
              <span>Restaurant name</span>
              <input
                type="text"
                value={preferences.restaurantName}
                onChange={event => updatePreference('restaurantName', event.target.value)}
                placeholder="Enter restaurant name"
                disabled={!loaded}
              />
            </label>
            <label className="setting-field">
              <span>City or location</span>
              <input
                type="text"
                value={preferences.city}
                onChange={event => updatePreference('city', event.target.value)}
                placeholder="Enter city or location"
                disabled={!loaded}
              />
            </label>
            <h2>Service hours</h2>
            <label className="setting-field">
              <span>Service starts</span>
              <input
                type="time"
                value={preferences.serviceStart}
                onChange={event => updatePreference('serviceStart', event.target.value)}
                disabled={!loaded}
              />
            </label>
            <label className="setting-field">
              <span>Service ends</span>
              <input
                type="time"
                value={preferences.serviceEnd}
                onChange={event => updatePreference('serviceEnd', event.target.value)}
                disabled={!loaded}
              />
            </label>
            <label className="setting-field">
              <span>Currency</span>
              <select
                value={preferences.currency}
                onChange={event => updatePreference('currency', event.target.value)}
                disabled={!loaded}
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>{currency.label}</option>
                ))}
              </select>
            </label>
            <p className="muted-copy">These details are saved in this browser for this prototype.</p>
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
              {loaded ? savedMessage : 'Loading settings…'}
            </p>
            <button
              className="outline-button"
              onClick={() => {
                if (window.confirm('Reset workspace data to its initial state? Your settings will be kept.')) {
                  dispatch({ type: 'reset-data' })
                }
              }}
            >
              Reset workspace data
            </button>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
