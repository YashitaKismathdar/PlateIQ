'use client'

import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, Flame, Gauge, Search, Sparkles, Utensils, Zap, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { usePlateIQ } from '@/components/plateiq-state'

export default function LiveOperationsPage() {
  const { state, dispatch } = usePlateIQ()
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const activeBatches = state.batches.filter(batch => batch.status !== 'Completed')
  const activeAlerts = state.alerts.filter(alert => !alert.dismissed)
  const prepared = state.dishes.reduce((total, dish) => total + dish.prepared, 0)
  const totalForecast = state.forecasts.reduce((total, forecast) => total + forecast.forecast, 0)
  const capacity = state.stations.length
    ? Math.round(state.stations.reduce((total, station) => total + station.capacity, 0) / state.stations.length)
    : 0
  const visibleBatches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const matching = activeBatches.filter(batch => {
      const dish = state.dishes.find(item => item.id === batch.dishId)
      const station = dish?.category === 'Breads' ? 'bread' : dish?.category === 'Sides' ? 'prep' : 'hot'
      const stationName = state.stations.find(item => item.id === station)?.name ?? station
      return [dish?.name ?? batch.dishId, batch.status, `batch ${batch.number}`, stationName]
        .some(value => value.toLowerCase().includes(normalized))
    })
    return showAll ? matching : matching.slice(0, 5)
  }, [activeBatches, query, showAll, state.dishes, state.stations])

  const stationTone = (status: string, capacityValue: number) =>
    status === 'At Risk' || capacityValue >= 90 ? 'red' : status === 'Busy' || capacityValue >= 75 ? 'orange' : ''

  const nextAction = (status: string) =>
    status === 'Recommended' ? 'Start preparation' : status === 'In Preparation' ? 'Mark ready' : 'Complete batch'

  const advanceBatch = (batchId: string) => dispatch({ type: 'batch', batchId })

  return <AppShell>
    <div className="page-body stitch-workspace-page stitch-page-live-operations">
      <div className="page-heading">
        <div>
          <div className="eyebrow">KITCHEN OPERATIONS <span className="separator">/</span> KITCHEN FLOOR</div>
          <h1>Kitchen command center</h1>
          <p>Track preparation batches, station capacity, and operational alerts in one place.</p>
        </div>
        <div className="heading-actions">
          
          <a className="outline-button live-operations-link" href="/app/kitchen-planner">Open task planner <ArrowRight /></a>
        </div>
      </div>

      <div className="live-operations-summary">
        <div className="live-operations-status">Kitchen operations <span className="summary-divider" /> Updates as you change preparation batches</div>
        <div className="live-operations-shift"><Clock3 /> {state.restaurant.name} <span>·</span> {state.restaurant.city}</div>
      </div>

      <section className="metrics-grid live-operations-metrics">
        <div className="metric-card"><div className="metric-top"><span>Active prep batches</span><span className="metric-dot" /></div><div className="metric-value">{activeBatches.length}</div><div className="metric-bottom"><span>Not yet completed</span><span>{state.batches.length} total</span></div></div>
        <div className="metric-card"><div className="metric-top"><span>Plates prepared</span><span className="metric-dot" /></div><div className="metric-value">{prepared.toLocaleString('en-IN')}</div><div className="metric-bottom"><span>Across tracked menu items</span><span>Tracked records</span></div></div>
        <div className="metric-card"><div className="metric-top"><span>Average station capacity</span><span className="metric-dot" /></div><div className="metric-value">{capacity}%</div><div className="metric-bottom"><span>Configured station average</span><span>{state.stations.length} stations</span></div></div>
        <div className="metric-card"><div className="metric-top"><span>Open alerts</span><span className="metric-dot orange" /></div><div className="metric-value">{activeAlerts.length}</div><div className="metric-bottom"><span>Unresolved operational flags</span><span>{activeAlerts.filter(alert => alert.severity === 'critical').length} critical</span></div></div>
      </section>

      <section className="live-station-grid">
        {state.stations.map(station => {
          const tone = stationTone(station.status, station.capacity)
          const relatedBatches = activeBatches.filter(batch => {
            const dish = state.dishes.find(item => item.id === batch.dishId)
            const stationId = dish?.category === 'Breads' ? 'bread' : dish?.category === 'Sides' ? 'prep' : 'hot'
            return station.id === stationId
          })
          return <article className="panel live-station-card" key={station.id}>
            <div className="live-station-heading"><div className="live-station-icon"><Utensils /></div><span className={'station-state ' + tone}><span /> {station.status}</span></div>
            <h2>{station.name}</h2>
            <div className="live-station-stats"><div><strong>{station.capacity}%</strong><span>Configured capacity</span></div><div><strong>{relatedBatches.length}</strong><span>Active batches</span></div></div>
            <div className="station-progress"><span className={tone} style={{ width: `${Math.max(0, Math.min(100, station.capacity))}%` }} /></div>
            <small className="live-station-footnote">{station.status === 'At Risk' ? 'Review workload and stock dependencies.' : station.status === 'Busy' ? 'Preparation is underway at this station.' : 'No station-level risk is flagged.'}</small>
          </article>
        })}
      </section>

      <section className="dashboard-grid live-operations-main-grid">
        <div className="panel live-tickets-panel">
          <div className="panel-heading"><div><div className="section-kicker"><Flame /> Preparation queue</div><h2>Active kitchen batches</h2><p className="muted-copy">Advance each batch as preparation progresses. Changes update the workspace.</p></div><span className="status-badge">{activeBatches.length} active</span></div>
          <label className="live-ticket-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search dish, batch, station, status…" /></label>
          <div className="live-ticket-list">
            {visibleBatches.map(batch => {
              const dish = state.dishes.find(item => item.id === batch.dishId)
              const stationId = dish?.category === 'Breads' ? 'bread' : dish?.category === 'Sides' ? 'prep' : 'hot'
              const station = state.stations.find(item => item.id === stationId)
              const tone = batch.status === 'In Preparation' ? 'red' : batch.status === 'Ready' ? '' : 'orange'
              return <article className="live-ticket live-batch-ticket" key={batch.id}>
                <div className="ticket-table-number">#{batch.number}</div>
                <div className="ticket-main">
                  <div className="ticket-title-row"><strong>{dish?.name ?? batch.dishId}</strong><span>{batch.quantity.toLocaleString('en-IN')} plates</span><small><Clock3 /> {dish?.leadTimeMinutes ?? 0} min lead</small></div>
                  <div className="ticket-dishes"><span>{dish?.category ?? 'Menu item'}</span><span>{station?.name ?? 'Kitchen station'}</span></div>
                  <div className="ticket-station"><span>Batch #{batch.number}</span><span className={'status-badge ' + (tone === 'red' ? 'red' : tone === 'orange' ? 'orange' : '')}>{batch.status}</span></div>
                  <div className="live-batch-actions"><button className="primary-button" onClick={() => advanceBatch(batch.id)}>{nextAction(batch.status)} <ArrowRight /></button></div>
                </div>
              </article>
            })}
            {visibleBatches.length === 0 && <div className="live-ticket-empty">{query ? `No active batches match “${query}”. Try another search.` : 'No active batches. All tracked preparation is complete.'}</div>}
          </div>
          {activeBatches.length > 5 && (showAll || query.trim() === '' || visibleBatches.length === 5) && <button className="live-view-all" onClick={() => setShowAll(value => !value)}>{showAll ? 'Show fewer batches' : 'View all active batches'} <ArrowRight /></button>}
        </div>

        <div className="panel service-pacing-panel">
          <div className="panel-heading"><div><div className="section-kicker"><Gauge /> Service health</div><h2>Preparation against demand</h2><p className="muted-copy">Current tracked preparation compared with the forecast.</p></div><span className="pacing-icon"><Activity /></span></div>
          <div className="pacing-score"><strong>{totalForecast ? Math.min(100, Math.round(prepared / totalForecast * 100)) : 0}%</strong><span>of projected demand prepared</span><div><span /> Local snapshot</div></div>
          <div className="live-demand-progress"><div><span>Prepared plates</span><strong>{prepared.toLocaleString('en-IN')}</strong></div><div className="station-progress"><span style={{ width: `${totalForecast ? Math.min(100, prepared / totalForecast * 100) : 0}%` }} /></div><div><span>Forecast demand</span><strong>{totalForecast.toLocaleString('en-IN')}</strong></div></div>
          <div className="pacing-metrics"><div><span>Recommended batches</span><strong>{state.batches.filter(batch => batch.status === 'Recommended').length}</strong></div><div><span>In preparation</span><strong>{state.batches.filter(batch => batch.status === 'In Preparation').length}</strong></div><div><span>Ready to complete</span><strong>{state.batches.filter(batch => batch.status === 'Ready').length}</strong></div></div>
          <div className="live-ai-recommendation"><div className="recommendation-icon"><Sparkles /></div><div><strong>Operational note</strong><p>{state.recommendations[0]?.description ?? 'No preparation recommendation is currently recorded. Review the task planner for the next action.'}</p><a href="/app/kitchen-planner">Review preparation plan <ArrowRight /></a></div></div>
        </div>
      </section>

      <section className="dashboard-grid live-operations-lower-grid">
        <div className="panel">
          <div className="panel-heading"><div><div className="section-kicker"><CheckCircle2 /> Activity log</div><h2>Recent operational events</h2><p className="muted-copy">Actions recorded in the workspace.</p></div><span className="status-badge">{state.events.length} events</span></div>
          <div className="dispatched-list">
            {state.events.slice(0, 5).map(event => <div className="dispatched-item" key={event.id}><div className="dispatched-check"><CheckCircle2 /></div><div className="dispatched-detail"><strong>{event.title}</strong><span>{event.description}</span><small>{event.timestamp} · {event.type}</small></div><span className={'status-badge ' + (event.severity === 'critical' ? 'red' : event.severity === 'warning' ? 'orange' : '')}>{event.severity}</span></div>)}
            {state.events.length === 0 && <div className="live-ticket-empty">No activity has been recorded in this session yet. Start or advance a batch to create the first event.</div>}
          </div>
        </div>

        <div className="panel live-expedite-panel">
          <div className="panel-heading"><div><div className="section-kicker"><AlertTriangle /> Needs attention</div><h2>Operational alerts</h2><p className="muted-copy">Unresolved operational alerts.</p></div><span className="status-badge orange">{activeAlerts.length} open</span></div>
          <div className="live-alert-list">
            {activeAlerts.slice(0, 4).map(alert => <article className="expedite-alert" key={alert.id}><div className="expedite-icon"><AlertTriangle /></div><div><strong>{alert.title}</strong><p>{alert.description}</p><span>{alert.severity} priority</span></div><button className="live-dismiss-alert" aria-label={`Dismiss ${alert.title}`} onClick={() => dispatch({ type: 'dismiss-alert', alertId: alert.id })}><X /></button></article>)}
            {activeAlerts.length === 0 && <div className="live-ticket-empty">No unresolved alerts. You’re clear for now.</div>}
          </div>
          <div className="expedite-actions"><a className="outline-button" href="/app/inventory">Check inventory</a><a className="primary-button" href="/app/kitchen-planner">Open task planner <ArrowRight /></a></div>
        </div>
      </section>

      <section className="panel live-throughput-panel">
        <div className="panel-heading"><div><div className="section-kicker"><Zap /> Menu readiness</div><h2>Preparation by menu item</h2><p className="muted-copy">See how much of each dish’s forecast is prepared.</p></div></div>
        <div className="live-menu-readiness">
          {state.dishes.map(dish => {
            const percent = dish.forecast ? Math.min(100, Math.round(dish.prepared / dish.forecast * 100)) : 0
            return <div className="live-menu-row" key={dish.id}><div className="live-menu-label"><strong>{dish.name}</strong><span>{dish.category}</span></div><div className="live-menu-track"><span style={{ width: `${percent}%` }} /></div><div className="live-menu-count"><strong>{percent}%</strong><small>{dish.prepared}/{dish.forecast} plates</small></div></div>
          })}
        </div>
      </section>
    </div>
  </AppShell>
}
