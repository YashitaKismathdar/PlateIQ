'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { usePlateIQ } from '@/components/plateiq-state'
import { Bell, Building2, Clock3, Database, Globe2, Save, ShieldCheck, SlidersHorizontal, CheckCircle2, AlertTriangle } from 'lucide-react'

type WorkspaceSettings = {
  restaurantName: string
  location: string
  serviceName: string
  lunchStart: string
  lunchEnd: string
  dinnerStart: string
  dinnerEnd: string
  currency: string
  timezone: string
  notifications: boolean
  operationalAlerts: boolean
  lowStockAlerts: boolean
  dailySummary: boolean
  compactTables: boolean
}

const defaults: WorkspaceSettings = {
  restaurantName: 'Jubilee Hills Restaurant',
  location: 'Hyderabad, India',
  serviceName: 'Lunch & Dinner Service',
  lunchStart: '11:00',
  lunchEnd: '15:00',
  dinnerStart: '18:00',
  dinnerEnd: '22:00',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  notifications: true,
  operationalAlerts: true,
  lowStockAlerts: true,
  dailySummary: false,
  compactTables: false,
}

const storageKey = 'plateiq-workspace-settings'

export default function SettingsPage() {
  const { dispatch } = usePlateIQ()
  const [settings, setSettings] = useState<WorkspaceSettings>(defaults)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored) setSettings({ ...defaults, ...JSON.parse(stored) })
    } catch {
      // Keep the safe defaults if local browser storage is unavailable.
    } finally {
      setLoaded(true)
    }
  }, [])

  function update<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) {
    setSettings(current => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(settings))
      setSaved(true)
    } catch {
      setSaved(false)
      window.alert('Your browser could not save these preferences. Check your browser storage settings.')
    }
  }

  function resetDemoData() {
    const confirmed = window.confirm('Reset the current PlateIQ demo data? This will restore the demo workspace data and cannot be undone.')
    if (confirmed) dispatch({ type: 'reset-data' })
  }

  return (
    <AppShell>
      <div className="page-body settings-page">
        <div className="page-heading settings-page-heading">
          <div>
            <div className="eyebrow">WORKSPACE CONFIGURATION</div>
            <h1>Settings</h1>
            <p>Manage your restaurant workspace, service schedule, and notification preferences.</p>
          </div>
          <button className="settings-save-button" onClick={saveSettings} disabled={!loaded}>
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saved ? 'Saved' : 'Save changes'}
          </button>
        </div>

        <div className="settings-demo-note">
          <ShieldCheck size={17} />
          <div><strong>Workspace preferences</strong><span>These settings are saved in this browser for the demo. Account-wide settings and real notifications require backend integration.</span></div>
        </div>

        {saved && <div className="settings-saved-message" role="status"><CheckCircle2 size={16} /> Your workspace preferences have been saved on this device.</div>}

        <div className="settings-layout">
          <nav className="settings-anchor-nav" aria-label="Settings sections">
            <a href="#restaurant-settings"><Building2 size={16} /> Restaurant profile</a>
            <a href="#service-settings"><Clock3 size={16} /> Service hours</a>
            <a href="#regional-settings"><Globe2 size={16} /> Regional preferences</a>
            <a href="#notification-settings"><Bell size={16} /> Notifications</a>
            <a href="#display-settings"><SlidersHorizontal size={16} /> Display preferences</a>
            <a href="#data-settings"><Database size={16} /> Demo data</a>
          </nav>

          <div className="settings-sections">
            <section id="restaurant-settings" className="panel settings-section">
              <div className="settings-section-heading"><div className="settings-section-icon"><Building2 size={18} /></div><div><h2>Restaurant profile</h2><p>Basic details for this PlateIQ workspace.</p></div></div>
              <div className="settings-form-grid">
                <label className="settings-field"><span>Restaurant name</span><input value={settings.restaurantName} onChange={e => update('restaurantName', e.target.value)} placeholder="Enter restaurant name" /></label>
                <label className="settings-field"><span>Location</span><input value={settings.location} onChange={e => update('location', e.target.value)} placeholder="City, country" /></label>
                <label className="settings-field settings-field-full"><span>Service schedule label</span><input value={settings.serviceName} onChange={e => update('serviceName', e.target.value)} placeholder="e.g. Lunch & Dinner Service" /></label>
              </div>
            </section>

            <section id="service-settings" className="panel settings-section">
              <div className="settings-section-heading"><div className="settings-section-icon"><Clock3 size={18} /></div><div><h2>Service hours</h2><p>Set the usual operating windows shown in your workspace.</p></div></div>
              <div className="settings-form-grid">
                <label className="settings-field"><span>Lunch starts</span><input type="time" value={settings.lunchStart} onChange={e => update('lunchStart', e.target.value)} /></label>
                <label className="settings-field"><span>Lunch ends</span><input type="time" value={settings.lunchEnd} onChange={e => update('lunchEnd', e.target.value)} /></label>
                <label className="settings-field"><span>Dinner starts</span><input type="time" value={settings.dinnerStart} onChange={e => update('dinnerStart', e.target.value)} /></label>
                <label className="settings-field"><span>Dinner ends</span><input type="time" value={settings.dinnerEnd} onChange={e => update('dinnerEnd', e.target.value)} /></label>
              </div>
            </section>

            <section id="regional-settings" className="panel settings-section">
              <div className="settings-section-heading"><div className="settings-section-icon"><Globe2 size={18} /></div><div><h2>Regional preferences</h2><p>Choose the currency and time zone used for this workspace.</p></div></div>
              <div className="settings-form-grid">
                <label className="settings-field"><span>Currency</span><select value={settings.currency} onChange={e => update('currency', e.target.value)}><option value="INR">INR — Indian Rupee (₹)</option><option value="USD">USD — US Dollar ($)</option><option value="GBP">GBP — British Pound (£)</option><option value="EUR">EUR — Euro (€)</option><option value="AED">AED — UAE Dirham</option></select></label>
                <label className="settings-field"><span>Time zone</span><select value={settings.timezone} onChange={e => update('timezone', e.target.value)}><option value="Asia/Kolkata">India Standard Time (IST)</option><option value="Asia/Dubai">Gulf Standard Time (GST)</option><option value="Europe/London">United Kingdom (London)</option><option value="Europe/Paris">Central European Time</option><option value="America/New_York">US Eastern Time</option><option value="America/Los_Angeles">US Pacific Time</option><option value="UTC">UTC</option></select></label>
              </div>
            </section>

            <section id="notification-settings" className="panel settings-section">
              <div className="settings-section-heading"><div className="settings-section-icon"><Bell size={18} /></div><div><h2>Notifications</h2><p>Choose which reminders you would like PlateIQ to show.</p></div></div>
              <div className="settings-toggle-list">
                <label className="settings-toggle-row"><span><strong>Workspace notifications</strong><small>Allow notification preferences for this workspace.</small></span><input type="checkbox" checked={settings.notifications} onChange={e => update('notifications', e.target.checked)} /></label>
                <label className="settings-toggle-row"><span><strong>Operational alerts</strong><small>Highlight important kitchen and service updates.</small></span><input type="checkbox" checked={settings.operationalAlerts} onChange={e => update('operationalAlerts', e.target.checked)} /></label>
                <label className="settings-toggle-row"><span><strong>Low-stock alerts</strong><small>Flag ingredients that need a stock review.</small></span><input type="checkbox" checked={settings.lowStockAlerts} onChange={e => update('lowStockAlerts', e.target.checked)} /></label>
                <label className="settings-toggle-row"><span><strong>Daily summary</strong><small>Preference for a daily operational summary (delivery is not connected).</small></span><input type="checkbox" checked={settings.dailySummary} onChange={e => update('dailySummary', e.target.checked)} /></label>
              </div>
            </section>

            <section id="display-settings" className="panel settings-section">
              <div className="settings-section-heading"><div className="settings-section-icon"><SlidersHorizontal size={18} /></div><div><h2>Display preferences</h2><p>Adjust how dense operational tables should look.</p></div></div>
              <label className="settings-toggle-row"><span><strong>Compact tables</strong><small>Save vertical space in supported tables. This preference is stored locally; page-wide styling may need further integration.</small></span><input type="checkbox" checked={settings.compactTables} onChange={e => update('compactTables', e.target.checked)} /></label>
            </section>

            <section id="data-settings" className="panel settings-section settings-danger-section">
              <div className="settings-section-heading"><div className="settings-section-icon settings-danger-icon"><AlertTriangle size={18} /></div><div><h2>Demo data</h2><p>Restore the sample restaurant data used by the frontend prototype.</p></div></div>
              <div className="settings-reset-row"><div><strong>Reset application data</strong><small>This resets the current demo operational data. Your saved settings in this browser are kept.</small></div><button className="settings-reset-button" onClick={resetDemoData}>Reset demo data</button></div>
            </section>
          </div>
        </div>
        <div className="settings-bottom-actions"><span>Changes are not applied until you save.</span><button className="settings-save-button" onClick={saveSettings} disabled={!loaded}><Save size={15} /> Save changes</button></div>
      </div>
    </AppShell>
  )
}
