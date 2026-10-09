'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  Bell,
  ChevronDown,
  CloudRain,
  Gauge,
  LayoutDashboard,
  Leaf,
  Menu,
  Package,
  Settings2,
  Sparkles,
  ClipboardList,
  X,
} from 'lucide-react'
import { navItems, usePlateIQ } from './plateiq-state'

type SignedInUser = {
  name: string
  role: string
  email?: string
}

const iconByLabel: Record<string, typeof LayoutDashboard> = {
  Overview: LayoutDashboard,
  'Live Operations': Activity,
  Tasks: ClipboardList,
  Forecasting: Gauge,
  Inventory: Package,
  'Waste Management': Leaf,
  'External Factors': CloudRain,
  'AI Copilot': Sparkles,
  Insights: Activity,
  Settings: Settings2,
}

function initialsFor(name: string) {
  const initials = name
    .trim()
    .split(/\\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return initials.toUpperCase() || 'U'
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { state, dispatch } = usePlateIQ()
  const [open, setOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [signedInUser, setSignedInUser] = useState<SignedInUser | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSignedInUser() {
      try {
        // The backend should return { user: { name, role, email } } for the
        // current authenticated session. Do not use a demo person's identity.
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })

        if (!response.ok) {
          setSignedInUser(null)
          return
        }

        const payload: unknown = await response.json()
        if (!payload || typeof payload !== 'object' || !('user' in payload)) {
          setSignedInUser(null)
          return
        }

        const user = (payload as { user?: Record<string, unknown> | null }).user
        if (!user || typeof user.name !== 'string' || !user.name.trim()) {
          setSignedInUser(null)
          return
        }

        setSignedInUser({
          name: user.name.trim(),
          role: typeof user.role === 'string' && user.role.trim()
            ? user.role.trim()
            : 'Restaurant manager',
          email: typeof user.email === 'string' ? user.email : undefined,
        })
      } catch {
        if (!controller.signal.aborted) setSignedInUser(null)
      } finally {
        if (!controller.signal.aborted) setProfileLoading(false)
      }
    }

    loadSignedInUser()
    return () => controller.abort()
  }, [])

  const userName = signedInUser?.name ?? (profileLoading ? 'Loading profile…' : 'Account unavailable')
  const userRole = signedInUser?.role ?? (profileLoading ? 'Checking signed-in account' : 'Sign in to view your profile')
  const userInitials = signedInUser ? initialsFor(signedInUser.name) : '—'

  return (
    <main className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-main">
        <div className="brand">
          <div className="brand-mark"><Leaf /></div>
          <span>Plate<span>IQ</span></span>
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="primary-navigation">
          {navItems.map(([label, href]) => {
            const Icon = iconByLabel[label] ?? LayoutDashboard
            return (
              <a
                href={href}
                key={label}
                className={`nav-item ${path === href ? 'active' : ''}`}
                aria-current={path === href ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setOpen(false)
                  if (path !== href) router.push(href)
                }}
              >
                <Icon />
                {label}
                {label === 'Live Operations' && <span className="live-pill">LIVE</span>}
                {label === 'AI Copilot' && <span className="new-pill">AI</span>}
              </a>
            )
          })}
        </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-status"><span className="status-pulse" /> Kitchen intelligence online</div>
          <div className="profile" title={signedInUser?.email ?? undefined}>
            <div className="profile-avatar">{userInitials}</div>
            <div>
              <strong>{userName}</strong>
              <small>{userRole}</small>
            </div>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <div className="breadcrumbs">
            <span>Workspace</span><span>/</span>
            <strong>{navItems.find(([, href]) => href === path)?.[0] || 'Overview'}</strong>
          </div>
          <div className="top-actions">
            <div className="system-live"><span /> AI system live</div>
            <button className="icon-button" aria-label="Notifications" onClick={() => setNotificationsOpen((value) => !value)}>
              <Bell />
              {state.notifications.filter((notification) => !notification.read).length > 0 && (
                <i>{state.notifications.filter((notification) => !notification.read).length}</i>
              )}
            </button>
            {notificationsOpen && (
              <div className="notification-panel">
                <div className="notification-head">
                  <strong>Notifications</strong>
                  <button onClick={() => dispatch({ type: 'read-notifications' })}>Mark all read</button>
                </div>
                {state.notifications.length === 0
                  ? <p>No new operational notifications.</p>
                  : state.notifications.slice(0, 5).map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      onClick={() => {
                        dispatch({ type: 'read-notification', notificationId: notification.id })
                        setNotificationsOpen(false)
                      }}
                      className={`notification-item ${notification.read ? 'read' : ''}`}
                    >
                      <strong>{notification.title}</strong>
                      <span>{notification.description}</span>
                    </Link>
                  ))}
              </div>
            )}
            <div className="system-status-label"><span className="status-pulse" /> Operational data</div>
            <div className="top-avatar">{userInitials}</div>
          </div>
        </header>
        {children}
      </section>
    </main>
  )
}
