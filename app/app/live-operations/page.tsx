'use client'

import type React from 'react'
import Link from 'next/link'

const stations = [
  { name: 'Sauté Rail', status: 'ACTIVE', load: '92%', tickets: 8 },
  { name: 'Grill', status: 'ACTIVE', load: '78%', tickets: 6 },
  { name: 'Garde Manger', status: 'STEADY', load: '54%', tickets: 4 },
  { name: 'Pastry', status: 'STEADY', load: '41%', tickets: 3 },
]

const tickets = [
  { table: 'Table 12', covers: '4 Covers', time: '08:42', items: ['Beef Tenderloin', 'Pommes Anna'], station: 'Sauté', status: 'Firing' },
  { table: 'Table 7', covers: '2 Covers', time: '08:35', items: ['Sea Bass', 'Spring Vegetables'], station: 'Grill', status: 'In Progress' },
  { table: 'Table 18', covers: '6 Covers', time: '08:31', items: ['Duck Confit', 'Risotto'], station: 'Sauté', status: 'Waiting' },
  { table: 'Table 4', covers: '2 Covers', time: '08:25', items: ['Scallops', 'Crudo'], station: 'Garde Manger', status: 'Ready' },
]

const dispatched = [
  { table: 'Table 6', covers: '4 Covers • Mains', sla: '13m 10s SLA', cleared: '4m ago', runner: 'David L.' },
  { table: 'Table 9', covers: '2 Covers • Desserts', sla: '12m 45s SLA', cleared: '8m ago', runner: 'Sophia K.' },
  { table: 'Table 2', covers: '6 Covers • Starters', sla: '10m 20s SLA', cleared: '13m ago', runner: 'David L.' },
]

const waves = [
  ['17:00', 25], ['17:15', 38], ['17:30', 52], ['17:45', 88],
  ['18:00', 94], ['18:15', 84], ['18:30', 70], ['18:45', 60], ['19:00', 48],
]

export default function LiveOperationsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18352A]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[#E8E5DE] bg-[#FDFBF7] lg:flex lg:flex-col">
        <div className="border-b border-[#E8E5DE] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E281E] text-lg font-bold text-white">P</div>
            <div>
              <div className="text-xl font-bold tracking-tight">PlateIQ</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#718078]">AI Kitchen OS</div>
            </div>
            <span className="ml-auto rounded-full bg-[#DDEDE4] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0E6B47]">v4.2</span>
          </div>
        </div>

        <div className="border-b border-[#E8E5DE] p-4">
          <div className="rounded-xl bg-[#F2F0EA] p-3">
            <div className="text-sm font-semibold">Atelier Lumière</div>
            <div className="mt-1 text-xs text-[#718078]">Main Dining · Downtown</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <NavSection title="Core Operations">
            <NavItem href="/app" icon="grid_view">Overview</NavItem>
            <NavItem href="/app/live-operations" icon="skillet" active badge="14 active">Live Operations</NavItem>
            <NavItem href="/app/kitchen-planner" icon="checklist" badge="3 pending">Tasks</NavItem>
          </NavSection>
          <NavSection title="Intelligence & Planning">
            <NavItem href="/app/demand-forecast" icon="trending_up">Forecasting</NavItem>
            <NavItem href="/app/inventory" icon="inventory_2" badge="2 low">Inventory</NavItem>
            <NavItem href="/app/waste-intelligence" icon="delete_sweep">Waste Management</NavItem>
            <NavItem href="/app/external-factors" icon="cloud">External Factors</NavItem>
          </NavSection>
          <NavSection title="AI Assistant & Strategy">
            <NavItem href="/app/copilot" icon="auto_awesome" accent>AI Copilot</NavItem>
            <NavItem href="/app/analytics" icon="insights">Insights</NavItem>
          </NavSection>
          <NavSection title="System">
            <NavItem href="/app/settings" icon="settings">Settings</NavItem>
          </NavSection>
        </nav>

        <div className="m-4 rounded-xl bg-[#F2F0EA] p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0E8F5A]" />
            Systems Operational
          </div>
          <div className="mt-2 text-xs text-[#718078]">AI Model v4.2 · Sync: 2m ago</div>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[#E8E5DE] bg-[#FDFBF7]/95 px-5 backdrop-blur-xl lg:px-8">
          <div className="flex rounded-lg bg-[#F2F0EA] p-1">
            <button className="rounded-md px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#718078]">Lunch Shift</button>
            <button className="rounded-md bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#0E281E] shadow-sm">Dinner Service</button>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex w-72 items-center gap-2 rounded-lg bg-[#F2F0EA] px-3 py-2 text-sm text-[#718078]">
              <span className="material-symbols-outlined text-lg">search</span>Search operations...
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F0EA]">
              <span className="material-symbols-outlined text-lg">notifications</span>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0E281E] text-xs font-bold text-white">CM</div>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0E8F5A]">Live Operations · Dinner Service</div>
              <h1 className="text-3xl font-bold tracking-tight text-[#0E281E] lg:text-4xl">Kitchen Command Center</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#718078]">Real-time service orchestration across stations, tickets, pacing and dispatch.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#CDE5D9] bg-[#EFF8F3] px-4 py-2 text-xs font-semibold text-[#0E6B47]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#0E8F5A]" />LIVE · Synced 12 sec ago
            </div>
          </div>

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stations.map((station) => (
              <div key={station.name} className="rounded-xl border border-[#E8E5DE] bg-white p-5 shadow-[0_1px_4px_rgba(20,40,30,0.04)]">
                <div className="flex items-start justify-between">
                  <div><div className="text-sm font-bold">{station.name}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#718078]">{station.status}</div></div>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0E8F5A]" />
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div><div className="text-3xl font-bold">{station.load}</div><div className="text-xs text-[#718078]">Station load</div></div>
                  <div className="text-right"><div className="text-lg font-bold">{station.tickets}</div><div className="text-xs text-[#718078]">tickets</div></div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#E8E5DE]"><div className="h-full rounded-full bg-[#0E8F5A]" style={{ width: station.load }} /></div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
            <div className="rounded-xl border border-[#E8E5DE] bg-white shadow-[0_1px_4px_rgba(20,40,30,0.04)]">
              <div className="flex items-center justify-between border-b border-[#E8E5DE] p-5">
                <div><h2 className="font-bold text-[#0E281E]">Active Kitchen Tickets</h2><p className="mt-1 text-xs text-[#718078]">Live synchronized ticket progression</p></div>
                <span className="rounded-full bg-[#DDEDE4] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0E6B47]">14 Active</span>
              </div>
              <div className="divide-y divide-[#E8E5DE]">
                {tickets.map((ticket) => (
                  <div key={ticket.table} className="p-5 transition hover:bg-[#FAF9F5]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0E281E] text-xs font-bold text-white">{ticket.table.replace('Table ', '#')}</div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2"><span className="font-bold">{ticket.table}</span><span className="text-xs text-[#718078]">{ticket.covers}</span></div>
                          <div className="mt-2 flex flex-wrap gap-2">{ticket.items.map((item) => <span key={item} className="rounded-md bg-[#F2F0EA] px-2 py-1 text-xs">{item}</span>)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right"><div className="text-xs font-bold">{ticket.station}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#718078]">{ticket.time}</div></div>
                        <span className="rounded-full bg-[#DDEDE4] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0E6B47]">{ticket.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E8E5DE] p-4 text-center"><button className="text-xs font-bold uppercase tracking-wider text-[#0E6B47] hover:underline">View all active tickets</button></div>
            </div>

            <div className="rounded-xl border border-[#E8E5DE] bg-white p-5 shadow-[0_1px_4px_rgba(20,40,30,0.04)]">
              <div className="flex items-center justify-between"><div><h2 className="font-bold">Service Pacing</h2><p className="mt-1 text-xs text-[#718078]">Current operational wave</p></div><span className="material-symbols-outlined text-[#0E8F5A]">speed</span></div>
              <div className="mt-8 text-center"><div className="text-5xl font-bold text-[#0E281E]">42</div><div className="mt-1 text-xs uppercase tracking-wider text-[#718078]">plates in current wave</div></div>
              <div className="mt-7 space-y-4">
                <Metric label="Kitchen SLA" value="96%" />
                <Metric label="Average pickup" value="48s" />
                <Metric label="On-time dispatch" value="99.4%" />
              </div>
              <div className="mt-6 rounded-xl bg-[#EFF8F3] p-4"><div className="flex items-start gap-3"><span className="material-symbols-outlined text-[#0E8F5A]">auto_awesome</span><div><div className="text-xs font-bold text-[#0E6B47]">PlateIQ recommendation</div><p className="mt-1 text-xs leading-5 text-[#527064]">Hold the next firing wave for approximately 90 seconds to prevent a bottleneck at the pass.</p></div></div></div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#E8E5DE] bg-white p-5">
              <div className="flex items-center justify-between"><div><h2 className="font-bold">Dispatched</h2><p className="mt-1 text-xs text-[#718078]">Past 15 minutes</p></div><span className="rounded-full bg-[#F2F0EA] px-3 py-1 text-[10px] font-bold uppercase tracking-wider">12 cleared</span></div>
              <div className="mt-5 space-y-3">{dispatched.map((item) => <div key={item.table} className="rounded-xl bg-[#FAF9F5] p-4"><div className="flex items-center justify-between"><div><span className="text-sm font-bold">{item.table}</span><span className="ml-2 text-[10px] uppercase tracking-wider text-[#718078]">{item.covers}</span></div><span className="text-[10px] font-bold text-[#0E6B47]">{item.sla}</span></div><div className="mt-2 flex justify-between text-[10px] text-[#718078]"><span>Cleared {item.cleared}</span><span>Runner: {item.runner}</span></div></div>)}</div>
            </div>

            <div className="rounded-xl border border-[#E8E5DE] bg-white p-5">
              <div className="flex items-center justify-between"><div><h2 className="font-bold">Expedite Alerts</h2><p className="mt-1 text-xs text-[#718078]">Items requiring attention</p></div><span className="rounded-full bg-[#FFF0DC] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#B66B1A]">2 alerts</span></div>
              <div className="mt-5 rounded-xl border border-[#F0DEC4] bg-[#FFF9F1] p-4"><div className="flex gap-3"><span className="material-symbols-outlined text-[#B66B1A]">warning</span><div><div className="text-sm font-bold">Sauce Béarnaise delayed</div><p className="mt-1 text-xs leading-5 text-[#80613C]">Waiting on Sauce Béarnaise ramekin from Sauté Rail.</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button className="rounded-lg bg-[#FFF0DC] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#B66B1A]">Nudge Sauté</button><button className="rounded-lg bg-[#0E281E] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white">Force Clear</button></div></div>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-[#E8E5DE] bg-white p-5 shadow-[0_1px_4px_rgba(20,40,30,0.04)] lg:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h2 className="font-bold">Service Throughput &amp; Pacing Heatmap</h2><p className="mt-1 text-xs text-[#718078]">Live synchronized plate progression across service waves</p></div><div className="flex flex-wrap gap-4 text-[10px] font-semibold uppercase tracking-wider text-[#718078]"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#0E281E]" />Mains</span><span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#0E8F5A]" />Starters</span><span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#DCD9D0]" />Forecast</span></div></div>
            <div className="mt-8 flex h-52 items-end gap-2 border-b border-[#E8E5DE]">
              {waves.map(([time, height], index) => <div key={time} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><div className={`relative w-full rounded-t-md transition-all ${index === 3 ? 'bg-[#0E281E]' : index >= 4 ? 'bg-[#DDEDE4] group-hover:bg-[#0E8F5A]' : 'bg-[#C9D0CB] group-hover:bg-[#0E8F5A]'}`} style={{ height: `${height}%` }}>{index === 3 && <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0E281E] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">Now · 42 plates</span>}</div><span className={`text-[9px] ${index === 3 ? 'font-bold text-[#0E281E]' : 'text-[#718078]'}`}>{time}</span></div>)}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-6"><div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#718078]">{title}</div><div className="space-y-1">{children}</div></div>
}

function NavItem({ href, icon, children, active = false, badge, accent = false }: { href: string; icon: string; children: React.ReactNode; active?: boolean; badge?: string; accent?: boolean }) {
  return <Link href={href} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${active ? 'bg-[#0E281E] font-semibold text-white shadow-sm' : 'text-[#53645C] hover:bg-[#F2F0EA] hover:text-[#0E281E]'}`}>
    <span className="flex items-center gap-3"><span className={`material-symbols-outlined text-[19px] ${accent ? 'text-[#0E8F5A]' : ''}`}>{icon}</span>{children}</span>
    {badge && <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${active ? 'bg-white/15 text-white' : 'bg-[#E9E7E0] text-[#718078]'}`}>{badge}</span>}
  </Link>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><div className="mb-2 flex items-center justify-between"><span className="text-xs text-[#718078]">{label}</span><span className="text-xs font-bold">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#E8E5DE]"><div className="h-full rounded-full bg-[#0E8F5A]" style={{ width: value.includes('%') ? value : value === '48s' ? '82%' : '94%' }} /></div></div>
}
