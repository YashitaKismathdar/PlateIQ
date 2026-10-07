'use client'

import type React from 'react'
import Link from 'next/link'
import { useState } from 'react'

const tasks = [
  { id: 1, title: 'A5 Miyazaki Striploin Precision Portioning', priority: 'Urgent P0', station: 'Hearth Station', detail: '28 portions × 6.0 oz • Prime center cuts for VIP tasting menu', time: '32m left', owner: 'Chef Laurent', role: 'Rotisseur', progress: 64, meta: 'Scale Tare Active • 8.2 kg' },
  { id: 2, title: 'Fresh Dungeness Crab Pick & Black Truffle Infusion', priority: 'High P1', station: 'Garde Manger', detail: 'Yield Target 4.5 lbs picked lump meat • Shells to crustacean stock cart', time: '45m left', owner: 'Chef Kenji', role: 'Larder Chef', progress: 0, meta: 'Status: Pending QA Verification • Strict Shelf Life: 24h at 34.0°F' },
  { id: 3, title: 'Halibut Filet Portion Yield Verification', priority: 'Completed', station: 'Sauté Station', detail: 'Skin-on yield 82.4% verified via IoT Smart Scale Tare at 16:40', time: '16:40 Logged', owner: 'Chef Anya', role: 'Sous Chef', progress: 100, meta: 'HACCP verification complete' },
]

const stationLoads = [
  ['Chef Anya', 'Sauté Lead', '82%', '5 tasks assigned (4 completed, 1 active)', 'Nominal'],
  ['Chef Laurent', 'Hearth & Grill', '95%', '4 tasks assigned (2 completed, 2 active)', 'Near Capacity'],
  ['Chef Kenji', 'Garde Manger', '64%', '4 tasks assigned (3 completed, 1 pending)', 'Available for Assist'],
  ['Chef Liam', 'Raw Bar', '100%', '3 tasks assigned (3 completed)', '100% Done'],
]

export default function KitchenPlannerPage() {
  const [activeTab, setActiveTab] = useState('All Tasks')
  const [completed, setCompleted] = useState<number[]>([3])

  const toggleTask = (id: number) => {
    setCompleted((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  return (
    <div className="min-h-screen bg-[#effdf0] text-[#121e16]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00341e] font-bold text-white">P</div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#00341e]">PlateIQ</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#414943]">AI Kitchen OS</span>
            </div>
          </div>
          <span className="rounded-full bg-[#96f3b9] px-2 py-0.5 text-[9px] font-bold uppercase text-[#007243]">v4.2</span>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-lg bg-[#e9f7ea] p-2.5">
            <span className="material-symbols-outlined text-[#006d40]">storefront</span>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold">Atelier Lumière</div>
              <div className="truncate text-[9px] uppercase tracking-wider text-[#414943]">Main Dining (Downtown)</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3">
          <NavGroup title="Core Operations">
            <NavItem href="/app">Overview</NavItem>
            <NavItem href="/app/live-operations" badge="14 active">Live Operations</NavItem>
            <NavItem href="/app/kitchen-planner" active badge="3 pending">Tasks</NavItem>
          </NavGroup>
          <NavGroup title="Intelligence & Planning">
            <NavItem href="/app/demand-forecast" badge="Live AI">Forecasting</NavItem>
            <NavItem href="/app/inventory" badge="2 low">Inventory</NavItem>
            <NavItem href="/app/waste-intelligence">Waste Management</NavItem>
            <NavItem href="/app/external-factors">External Factors</NavItem>
          </NavGroup>
          <NavGroup title="AI Assistant & Strategy">
            <NavItem href="/app/copilot" badge="PRO">AI Copilot</NavItem>
            <NavItem href="/app/analytics">Insights</NavItem>
          </NavGroup>
          <NavGroup title="System">
            <NavItem href="/app/settings">Settings</NavItem>
          </NavGroup>
        </nav>

        <div className="m-3 rounded-xl bg-[#e9f7ea] p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#006d40]" />
            Systems Operational
          </div>
          <div className="mt-1 text-[10px] text-[#414943]">AI Model v4.2 • Sync: 2m ago</div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white/90 px-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-4">
            <span className="font-bold text-[#00341e]">PlateIQ AI Kitchen OS</span>
            <span className="text-[#717972]/40">•</span>
            <span className="rounded-lg bg-[#e9f7ea] px-3 py-1.5 text-xs font-semibold">Atelier Lumière</span>
            <div className="hidden rounded-lg bg-[#e9f7ea] p-1 md:flex">
              <button className="rounded px-3 py-1 text-[10px] font-bold text-[#717972]">LUNCH SHIFT</button>
              <button className="rounded bg-white px-3 py-1 text-[10px] font-bold text-[#00341e] shadow-sm">DINNER SERVICE</button>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex w-80 items-center gap-2 rounded-lg bg-[#e9f7ea] px-3 py-2 text-xs text-[#717972]">
              <span className="material-symbols-outlined">search</span>
              <span className="flex-1">Search ingredients, tickets, forecasts...</span>
              <kbd className="rounded bg-[#d8e6d9] px-1.5 py-0.5 text-[9px]">⌘K</kbd>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-[#e9f7ea] px-3 py-1.5">
              <span className="material-symbols-outlined text-[#006d40]">timer</span>
              <div><div className="text-[8px] uppercase tracking-wider text-[#717972]">Dinner Service Prep</div><div className="text-xs font-bold">17:42:15</div></div>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#00341e] text-center text-[10px] font-bold leading-8 text-white">CM</div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] p-4 lg:p-7">
          <section className="rounded-xl bg-white p-5 shadow-sm lg:p-6">
            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#96f3b9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#007243]">Shift Phase: Pre-Service Rush</span>
                  <span className="text-[#717972]/40">•</span>
                  <span className="text-[11px] text-[#414943]"><span className="material-symbols-outlined mr-1 align-middle text-sm text-[#006d40]">verified_user</span>HACCP IoT Telemetry Online</span>
                  <span className="text-[#717972]/40">•</span>
                  <span className="text-[11px] text-[#414943]">Cut-off Target: 17:30</span>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#00341e] lg:text-[28px]">Brigade Tasks &amp; Operational Checklists</h1>
                <p className="mt-1 text-sm text-[#414943]">Dinner Service Preparation <span className="mx-1 text-[#717972]/40">|</span> Shift Lead: <strong className="text-[#121e16]">Chef Anya (Sous Chef)</strong> <span className="mx-1 text-[#717972]/40">|</span> <strong className="text-[#00341e]">182 Planned Covers</strong></p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton icon="print">Station Sheets</ActionButton>
                <ActionButton icon="health_and_safety">HACCP Audit</ActionButton>
                <ActionButton icon="neurology" green>AI Delegation Matrix</ActionButton>
                <ActionButton icon="add_task" primary>New Task +</ActionButton>
              </div>
            </div>
          </section>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {[
              ['All Tasks', '18'], ['Prep & Butchery', '6'], ['HACCP & Line Safety', '4'],
              ['Equipment & Sanitation', '5'], ['Manager Hand-off', '3'],
            ].map(([tab, count]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold ${activeTab === tab ? 'bg-[#174b32] text-white shadow-sm' : 'bg-white text-[#121e16] shadow-sm hover:bg-[#e9f7ea]'}`}>
                {tab}<span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === tab ? 'bg-[#96f3b9] text-[#007243]' : 'bg-[#d8e6d9] text-[#414943]'}`}>{count}</span>
              </button>
            ))}
          </div>

          <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Task Completion Rate" value="76.4%" detail="14 / 18 Done" accent="green" />
            <SummaryCard title="Critical Path Bottlenecks" value="1 Urgent" detail="Hearth Station" accent="red" />
            <SummaryCard title="HACCP & Safe Temp Compliance" value="100% Passed" detail="14 / 14 Logged IoT Probes" accent="green" />
            <SummaryCard title="AI Labor & Line Balance" value="94.2%" detail="8 Station Leads active · 0 Overtime risk" accent="lime" />
          </section>

          <section className="mt-6 rounded-xl bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-[#d8e6d9] p-5 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-bold text-[#121e16]">Urgent &amp; Time-Sensitive Pre-Service Tasks</h2>
                <p className="mt-1 text-[11px] text-[#717972]">Rush starts in 58m</p>
              </div>
              <span className="rounded-full bg-[#ffdad6] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#93000a]">1 Critical</span>
            </div>

            <div className="divide-y divide-[#d8e6d9]">
              {tasks.map((task) => {
                const isDone = completed.includes(task.id)
                return (
                  <article key={task.id} className="p-5 lg:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex gap-4">
                        <button onClick={() => toggleTask(task.id)} className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${isDone ? 'border-[#006d40] bg-[#006d40] text-white' : 'border-[#717972] text-transparent hover:border-[#006d40]'}`}>
                          <span className="material-symbols-outlined text-base">check</span>
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`text-sm font-bold ${isDone ? 'text-[#717972] line-through' : 'text-[#121e16]'}`}>{task.title}</h3>
                            <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${task.priority === 'Urgent P0' ? 'bg-[#ffdad6] text-[#93000a]' : task.priority === 'High P1' ? 'bg-[#fff0d6] text-[#7a4b00]' : 'bg-[#96f3b9] text-[#007243]'}`}>{task.priority}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#717972]"><span className="rounded bg-[#e9f7ea] px-2 py-1">{task.station}</span><span>{task.detail}</span></div>
                          <div className="mt-4 flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1 text-[10px] font-semibold"><span className="material-symbols-outlined text-sm text-[#006d40]">hourglass_top</span>{task.time}</span>
                            <span className="text-[10px] text-[#414943]">{task.owner} · {task.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-[260px] xl:w-[310px]">
                        <div className="flex justify-between text-[10px] font-semibold"><span>Batch Progress</span><span>{task.progress}%</span></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#d8e6d9]"><div className="h-full rounded-full bg-[#006d40]" style={{ width: `${task.progress}%` }} /></div>
                        <div className="mt-2 text-[10px] text-[#717972]">{task.meta}</div>
                        {task.id !== 3 && <div className="mt-3 rounded-lg bg-[#e9f7ea] p-3 text-[10px] text-[#414943]"><span className="material-symbols-outlined mr-1 align-middle text-sm text-[#006d40]">smart_toy</span><strong>AI Predictive Yield Target:</strong> {task.id === 1 ? '71.0%. Divert trim fat to tallow emulsion jar #2.' : 'Verify shelf life before release to service.'}</div>}
                      </div>
                    </div>
                    {task.id === 2 && <button onClick={() => toggleTask(2)} className="ml-11 mt-4 rounded-lg bg-[#174b32] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white">Approve &amp; Sign</button>}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><div><h2 className="text-base font-bold">HACCP Station Safety &amp; Critical Control Points</h2><p className="mt-1 text-[10px] text-[#717972]">Regulatory Audit Ready</p></div><span className="rounded-full bg-[#96f3b9] px-2 py-1 text-[9px] font-bold text-[#007243]">100% Passed</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Control label="Walk-in #2" value="36.4°F (Safe)" icon="check_circle" />
                <Control label="Blast Chiller" value="-12.0°F Calib" icon="sync" />
                <Control label="Batch #44" value="57.0°C ± 0.1°C" icon="check_circle" />
                <Control label="Raw Bar" value="Missing Tag Photo" icon="warning" danger />
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><div><h2 className="text-base font-bold">AI Task Copilot</h2><p className="mt-1 text-[10px] text-[#717972]">Dynamic Dispatch</p></div><span className="rounded-full bg-[#acf847] px-2 py-1 text-[9px] font-bold text-[#102000]">AI</span></div>
              <div className="mt-5 rounded-xl bg-[#effdf0] p-4">
                <div className="text-xs font-bold">Sous-Vide Duck Breast Surge Alert</div>
                <p className="mt-2 text-[11px] leading-5 text-[#414943]">Dinner reservations indicate 88 Duck Breast covers (+14% vs norm). Sauté station is 22 mins behind par. Recommend dispatching commis chef Leo from Garde Manger for 30 mins.</p>
                <div className="mt-4 flex flex-wrap gap-2"><button className="rounded-lg bg-[#174b32] px-3 py-2 text-[10px] font-bold text-white">Auto-Reassign to Leo</button><button className="rounded-lg bg-white px-3 py-2 text-[10px] font-bold">Dismiss</button></div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="text-base font-bold">Brigade Workload Balance</h2><p className="mt-1 text-[10px] text-[#717972]">Live Dispatch</p></div><span className="material-symbols-outlined text-[#006d40]">groups</span></div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {stationLoads.map(([name, role, load, detail, status]) => (
                <div key={name} className="rounded-xl bg-[#e9f7ea] p-4">
                  <div className="flex justify-between"><div><div className="text-xs font-bold">{name}</div><div className="text-[9px] uppercase tracking-wider text-[#717972]">{role}</div></div><span className="text-xs font-bold text-[#006d40]">{load}</span></div>
                  <div className="mt-3 h-1.5 rounded-full bg-[#d8e6d9]"><div className="h-full rounded-full bg-[#006d40]" style={{ width: load }} /></div>
                  <div className="mt-3 text-[10px] text-[#414943]">{detail}</div>
                  <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-[#006d40]">{status}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="mb-1 px-2 text-[9px] font-bold uppercase tracking-wider text-[#717972]">{title}</div><div className="space-y-0.5">{children}</div></div>
}

function NavItem({ href, children, active = false, badge }: { href: string; children: React.ReactNode; active?: boolean; badge?: string }) {
  return <Link href={href} className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs ${active ? 'bg-[#174b32] font-bold text-white shadow-sm' : 'text-[#414943] hover:bg-[#e9f7ea]'}`}>{children}{badge && <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${active ? 'bg-[#96f3b9] text-[#007243]' : 'bg-[#d8e6d9] text-[#414943]'}`}>{badge}</span>}</Link>
}

function ActionButton({ icon, children, primary = false, green = false }: { icon: string; children: React.ReactNode; primary?: boolean; green?: boolean }) {
  return <button className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm ${primary ? 'bg-[#174b32] text-white' : green ? 'bg-[#acf847] text-[#102000]' : 'bg-[#e9f7ea] text-[#121e16]'}`}><span className="material-symbols-outlined text-base">{icon}</span>{children}</button>
}

function SummaryCard({ title, value, detail, accent }: { title: string; value: string; detail: string; accent: 'green' | 'red' | 'lime' }) {
  const classes = accent === 'red' ? 'text-[#93000a]' : accent === 'lime' ? 'text-[#557000]' : 'text-[#006d40]'
  return <div className="rounded-xl bg-white p-4 shadow-sm"><div className="text-[9px] font-bold uppercase tracking-wider text-[#717972]">{title}</div><div className={`mt-2 text-xl font-bold ${classes}`}>{value}</div><div className="mt-1 text-[10px] text-[#717972]">{detail}</div></div>
}

function Control({ label, value, icon, danger = false }: { label: string; value: string; icon: string; danger?: boolean }) {
  return <div className="rounded-lg bg-[#e9f7ea] p-3"><div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#717972]">{label}<span className={danger ? 'text-[#ba1a1a]' : 'text-[#006d40]'}><span className="material-symbols-outlined text-base">{icon}</span></span></div><div className="mt-2 text-xs font-semibold">{value}</div></div>
}
