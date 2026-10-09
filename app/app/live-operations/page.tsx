'use client'

import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, Flame, Gauge, Search, Sparkles, Utensils, Zap } from 'lucide-react'
import { AppShell } from '@/components/app-shell'

const stations = [
  { name: 'Sauté Rail', load: 92, tickets: 8, status: 'Busy', tone: 'red' },
  { name: 'Grill', load: 78, tickets: 6, status: 'Busy', tone: 'orange' },
  { name: 'Garde Manger', load: 54, tickets: 4, status: 'Steady', tone: '' },
  { name: 'Pastry', load: 41, tickets: 3, status: 'Steady', tone: '' },
]
const tickets = [
  { table: 'Table 12', covers: 4, time: '08:42', items: ['Beef Tenderloin', 'Pommes Anna'], station: 'Sauté Rail', status: 'Firing' },
  { table: 'Table 7', covers: 2, time: '08:35', items: ['Sea Bass', 'Spring Vegetables'], station: 'Grill', status: 'In progress' },
  { table: 'Table 18', covers: 6, time: '08:31', items: ['Duck Confit', 'Risotto'], station: 'Sauté Rail', status: 'Waiting' },
  { table: 'Table 4', covers: 2, time: '08:25', items: ['Scallops', 'Crudo'], station: 'Garde Manger', status: 'Ready' },
  { table: 'Table 21', covers: 3, time: '08:19', items: ['Roasted Chicken', 'Seasonal Greens'], station: 'Grill', status: 'In progress' },
  { table: 'Table 3', covers: 2, time: '08:14', items: ['Chocolate Tart', 'Espresso'], station: 'Pastry', status: 'Waiting' },
]
const dispatched = [
  { table: 'Table 6', order: 'Mains · 4 covers', sla: '13m 10s', cleared: '4m ago', runner: 'David L.' },
  { table: 'Table 9', order: 'Desserts · 2 covers', sla: '12m 45s', cleared: '8m ago', runner: 'Sophia K.' },
  { table: 'Table 2', order: 'Starters · 6 covers', sla: '10m 20s', cleared: '13m ago', runner: 'David L.' },
]
const waves = [{time:'17:00',load:25},{time:'17:15',load:38},{time:'17:30',load:52},{time:'17:45',load:88},{time:'18:00',load:94},{time:'18:15',load:84},{time:'18:30',load:70},{time:'18:45',load:60},{time:'19:00',load:48}]

export default function LiveOperationsPage() {
  const [shift, setShift] = useState('Dinner Service')
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const visibleTickets = useMemo(() => {
    const matching = tickets.filter((ticket) => [ticket.table, ticket.station, ticket.status, ...ticket.items].some((value) => value.toLowerCase().includes(query.toLowerCase().trim())))
    return showAll ? matching : matching.slice(0, 4)
  }, [query, showAll])
  return <AppShell>
    <div className="page-body stitch-workspace-page stitch-page-live-operations">
      <div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> LIVE OPERATIONS <span className="separator">/</span> {shift.toUpperCase()}</div><h1>Kitchen command center</h1><p>Monitor kitchen stations, coordinate ticket flow, and keep service moving smoothly.</p></div><div className="heading-actions"><button className={shift === 'Lunch Shift' ? 'period-button selected' : 'period-button'} onClick={() => setShift('Lunch Shift')}>Lunch shift</button><button className={shift === 'Dinner Service' ? 'period-button selected' : 'period-button'} onClick={() => setShift('Dinner Service')}>Dinner service</button></div></div>
      <div className="live-operations-summary"><div className="live-operations-status"><span className="live-dot" /> Service monitor active <span className="summary-divider" /> Updated just now</div><div className="live-operations-shift"><Clock3 /> {shift} <span>·</span> Today</div></div>
      <section className="metrics-grid live-operations-metrics">
        <div className="metric-card"><div className="metric-top"><span>Active tickets</span><span className="metric-dot" /></div><div className="metric-value">14</div><div className="metric-bottom"><span>Across 4 kitchen stations</span></div></div>
        <div className="metric-card"><div className="metric-top"><span>Plates in current wave</span><span className="metric-dot" /></div><div className="metric-value">42</div><div className="metric-bottom"><span>Service wave in progress</span></div></div>
        <div className="metric-card"><div className="metric-top"><span>Kitchen SLA</span><span className="metric-dot" /></div><div className="metric-value">96%</div><div className="metric-bottom"><span>Orders within target</span></div></div>
        <div className="metric-card"><div className="metric-top"><span>Expedite alerts</span><span className="metric-dot orange" /></div><div className="metric-value">2</div><div className="metric-bottom"><span>Need team attention</span></div></div>
      </section>
      <section className="live-station-grid">{stations.map((station) => <article className="panel live-station-card" key={station.name}><div className="live-station-heading"><div className="live-station-icon"><Utensils /></div><span className={'station-state ' + station.tone}><span /> {station.status}</span></div><h2>{station.name}</h2><div className="live-station-stats"><div><strong>{station.load}%</strong><span>Station load</span></div><div><strong>{station.tickets}</strong><span>Open tickets</span></div></div><div className="station-progress"><span className={station.tone} style={{width: station.load + '%'}} /></div></article>)}</section>
      <section className="dashboard-grid live-operations-main-grid">
        <div className="panel live-tickets-panel"><div className="panel-heading"><div><div className="section-kicker"><Flame /> Kitchen queue</div><h2>Active kitchen tickets</h2><p className="muted-copy">Track order progress across the pass.</p></div><span className="status-badge">{visibleTickets.length} shown</span></div><label className="live-ticket-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search table, dish, station…" /></label><div className="live-ticket-list">{visibleTickets.map((ticket) => <article className="live-ticket" key={ticket.table}><div className="ticket-table-number">{ticket.table.replace('Table ', '#')}</div><div className="ticket-main"><div className="ticket-title-row"><strong>{ticket.table}</strong><span>{ticket.covers} covers</span><small><Clock3 /> {ticket.time}</small></div><div className="ticket-dishes">{ticket.items.map((item) => <span key={item}>{item}</span>)}</div><div className="ticket-station"><span>{ticket.station}</span><span className={'status-badge ' + (ticket.status === 'Waiting' ? 'orange' : ticket.status === 'Firing' ? 'red' : '')}>{ticket.status}</span></div></div></article>)}{visibleTickets.length === 0 && <div className="live-ticket-empty">No tickets match “{query}”. Try another search.</div>}</div><button className="live-view-all" onClick={() => setShowAll((value) => !value)}>{showAll ? 'Show fewer tickets' : 'View all tickets'} <ArrowRight /></button></div>
        <div className="panel service-pacing-panel"><div className="panel-heading"><div><div className="section-kicker"><Gauge /> Service health</div><h2>Service pacing</h2><p className="muted-copy">Performance for the current wave.</p></div><span className="pacing-icon"><Activity /></span></div><div className="pacing-score"><strong>42</strong><span>plates in current wave</span><div><span /> On pace</div></div><div className="pacing-metrics"><div><span>Average pickup</span><strong>48 sec</strong></div><div><span>On-time dispatch</span><strong>99.4%</strong></div><div><span>Delayed tickets</span><strong>2</strong></div></div><div className="live-ai-recommendation"><div className="recommendation-icon"><Sparkles /></div><div><strong>PlateIQ recommendation</strong><p>Hold the next firing wave for around 90 seconds to reduce congestion at the pass.</p></div></div></div>
      </section>
      <section className="dashboard-grid live-operations-lower-grid">
        <div className="panel"><div className="panel-heading"><div><div className="section-kicker"><CheckCircle2 /> Recently dispatched</div><h2>Orders cleared</h2><p className="muted-copy">Completed in the past 15 minutes.</p></div><span className="status-badge">12 cleared</span></div><div className="dispatched-list">{dispatched.map((item) => <div className="dispatched-item" key={item.table}><div className="dispatched-check"><CheckCircle2 /></div><div className="dispatched-detail"><strong>{item.table}</strong><span>{item.order}</span><small>Cleared {item.cleared} · Runner: {item.runner}</small></div><div className="dispatched-sla">{item.sla}<small>SLA</small></div></div>)}</div></div>
        <div className="panel live-expedite-panel"><div className="panel-heading"><div><div className="section-kicker"><AlertTriangle /> Needs attention</div><h2>Expedite alerts</h2><p className="muted-copy">Items that may delay the next plate.</p></div><span className="status-badge orange">2 alerts</span></div><div className="expedite-alert"><div className="expedite-icon"><AlertTriangle /></div><div><strong>Sauce Béarnaise delayed</strong><p>Waiting on a ramekin from the Sauté Rail before the plate can be cleared.</p><span>Table 12 <i /> High priority</span></div></div><div className="expedite-actions"><button className="outline-button" onClick={() => setQuery('Sauté Rail')}>Find Sauté tickets</button><button className="primary-button" onClick={() => setQuery('Table 12')}>View affected ticket <ArrowRight /></button></div></div>
      </section>
      <section className="panel live-throughput-panel"><div className="panel-heading"><div><div className="section-kicker"><Zap /> Service analytics</div><h2>Throughput &amp; pacing</h2><p className="muted-copy">Relative kitchen load across service waves.</p></div><span className="chart-live-badge"><span /> Current wave highlighted</span></div><div className="throughput-chart" role="img" aria-label="Kitchen load by 15-minute service wave">{waves.map((wave, index) => <div className="throughput-column" key={wave.time}><div className="throughput-bar-track"><span className={index === 3 ? 'current' : index === 4 ? 'peak' : ''} style={{height: wave.load + '%'}} /></div><span className={index === 3 ? 'current-time' : ''}>{wave.time}</span></div>)}</div><div className="throughput-footnote"><span><i className="throughput-legend-current" /> Current service wave</span><span><i className="throughput-legend-forecast" /> Other service intervals</span><strong>Peak load · 94%</strong></div></section>
    </div>
  </AppShell>
}
