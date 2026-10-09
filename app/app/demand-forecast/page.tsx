'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays,
  Check, CloudRain, Download, Info, RefreshCw, Search, Sparkles,
  TrendingUp, Utensils, Wind,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { usePlateIQ } from '@/components/plateiq-state'

type Risk = 'Low' | 'Medium' | 'High'
type ForecastItem = {
  id: string
  name: string
  category: string
  yesterday: number
  forecast: number
  low: number
  high: number
  cooked: number
  nextBatch: number
  confidence: number
  wasteRisk: Risk
  factor: string
}

const formatNumber = (value: number) => value.toLocaleString('en-IN')

function getRisk(prepared: number, forecast: number, upper: number): Risk {
  if (prepared > upper || prepared - forecast >= Math.max(10, forecast * 0.12)) return 'High'
  if (prepared < forecast || prepared > forecast) return 'Medium'
  return 'Low'
}

export default function DemandForecastPage() {
  const { state, dispatch } = usePlateIQ()
  const [range, setRange] = useState('All dishes')
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('All items')
  const [notice, setNotice] = useState('')

  const items = useMemo<ForecastItem[]>(() => state.dishes.map((dish) => {
    const forecast = state.forecasts.find((entry) => entry.dishId === dish.id)
    const batch = state.batches.find((entry) => entry.dishId === dish.id && entry.status === 'Recommended')
    const nextBatch = batch?.quantity ?? 0
    const cooked = dish.prepared + nextBatch
    const predicted = forecast?.forecast ?? dish.forecast
    const factor = predicted > dish.actualOrders
      ? 'Forecast above recorded orders'
      : predicted < dish.actualOrders
        ? 'Recorded orders above forecast'
        : 'Forecast aligns with recorded orders'
    return {
      id: dish.id, name: dish.name, category: dish.category,
      yesterday: dish.actualOrders, forecast: predicted,
      low: forecast?.lowerBound ?? dish.lowerBound,
      high: forecast?.upperBound ?? dish.upperBound,
      cooked, nextBatch, confidence: forecast?.confidence ?? dish.confidence,
      wasteRisk: getRisk(cooked, predicted, forecast?.upperBound ?? dish.upperBound),
      factor,
    }
  }), [state.dishes, state.forecasts, state.batches])

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase())
    const matchesRisk = riskFilter === 'All items' || item.wasteRisk === riskFilter
    return matchesQuery && matchesRisk
  }), [items, query, riskFilter])

  const totalDemand = items.reduce((sum, item) => sum + item.forecast, 0)
  const totalPrep = items.reduce((sum, item) => sum + item.cooked, 0)
  const excess = items.reduce((sum, item) => sum + Math.max(0, item.cooked - item.forecast), 0)
  const shortage = items.reduce((sum, item) => sum + Math.max(0, item.forecast - item.cooked), 0)
  const highRiskCount = items.filter((item) => item.wasteRisk === 'High').length
  const averageConfidence = items.length ? Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / items.length) : 0
  const chartItems = range === 'All dishes' ? items : range === 'Highest demand' ? [...items].sort((a, b) => b.forecast - a.forecast) : [...items].sort((a, b) => a.confidence - b.confidence)
  const chartScale = Math.max(1, ...chartItems.map((item) => Math.max(item.forecast, item.yesterday))) * 1.12

  function applyRecommendations() {
    dispatch({ type: 'apply-plan' })
    setNotice('Forecast plan recalculated with the current scenario and saved to the shared demo workspace.')
  }

  function resetView() {
    setRange('All dishes')
    setQuery('')
    setRiskFilter('All items')
    setNotice('Forecast filters reset. Shared kitchen data was not changed.')
  }

  function exportForecast() {
    const rows = [
      ['Dish', 'Category', 'Recorded orders', 'Forecast demand', 'Current prep + recommended batch', 'Lower range', 'Upper range', 'Confidence', 'Waste risk'],
      ...visibleItems.map((item) => [item.name, item.category, item.yesterday, item.forecast, item.cooked, item.low, item.high, item.confidence + '%', item.wasteRisk]),
    ]
    const csv = rows.map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'plateiq-demand-forecast.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Keep the object URL alive briefly so the browser can begin the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Forecast CSV exported for the currently visible dishes.')
  }

  return (
    <AppShell>
      <div className="page-content forecast-page">
        <div className="forecast-heading">
          <div>
            <div className="forecast-eyebrow"><Sparkles size={14} /> PREDICTIVE KITCHEN INTELLIGENCE</div>
            <h1>Demand forecasting</h1>
            <p>Plan smarter prep, meet demand, and reduce food waste before service begins.</p>
          </div>
          <div className="forecast-heading-actions">
            <button className="forecast-button forecast-button-secondary" onClick={resetView}><RefreshCw size={16} /> Reset view</button>
            <button className="forecast-button forecast-button-secondary" onClick={exportForecast}><Download size={16} /> Export CSV</button>
            <button className="forecast-button forecast-button-primary" onClick={applyRecommendations}><Sparkles size={16} /> Recalculate plan</button>
          </div>
        </div>

        {notice && <div className="forecast-notice" role="status"><Check size={16} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}

        <div className="forecast-context-row">
          <div className="forecast-context"><CalendarDays size={17} /><span><strong>Current demo service</strong><small>Forecasts from shared kitchen workspace</small></span></div>
          <div className="forecast-context"><CloudRain size={17} /><span><strong>{state.scenario.weather === 'Rain' || state.scenario.weather === 'Heavy Rain' ? state.scenario.weather : state.scenario.weather + ' conditions'}</strong><small>Scenario inputs from External Factors</small></span></div>
          <div className="forecast-context"><Utensils size={17} /><span><strong>{items.length} menu items tracked</strong><small>{averageConfidence}% average forecast confidence</small></span></div>
          <span className="forecast-demo-label"><Info size={13} /> Demo data · shared state</span>
        </div>

        <div className="forecast-kpi-grid">
          <article className="forecast-kpi">
            <div className="forecast-kpi-top"><span>Predicted portions</span><span className="forecast-kpi-icon"><Utensils size={17} /></span></div>
            <strong>{formatNumber(totalDemand)}</strong>
            <div className="forecast-kpi-foot"><span className="forecast-positive"><ArrowUpRight size={14} /> {averageConfidence}%</span> average model confidence</div>
          </article>
          <article className="forecast-kpi">
            <div className="forecast-kpi-top"><span>Prep incl. recommended batches</span><span className="forecast-kpi-icon"><Check size={17} /></span></div>
            <strong>{formatNumber(totalPrep)} <small>portions</small></strong>
            <div className="forecast-kpi-foot">Across {items.length} menu items</div>
          </article>
          <article className="forecast-kpi">
            <div className="forecast-kpi-top"><span>Potential over-prep</span><span className="forecast-kpi-icon forecast-icon-amber"><ArrowDownRight size={17} /></span></div>
            <strong>{formatNumber(excess)} <small>portions</small></strong>
            <div className="forecast-kpi-foot">{excess === 0 ? 'No excess prep in current plan' : 'Prep above the current demand estimate'}</div>
          </article>
          <article className="forecast-kpi">
            <div className="forecast-kpi-top"><span>Shortage exposure</span><span className="forecast-kpi-icon forecast-icon-red"><AlertTriangle size={17} /></span></div>
            <strong>{formatNumber(shortage)} <small>portions</small></strong>
            <div className="forecast-kpi-foot">{highRiskCount} dishes flagged as high risk</div>
          </article>
        </div>

        <section className="forecast-panel forecast-demand-panel">
          <div className="forecast-panel-heading">
            <div><span className="forecast-section-label">DISH-LEVEL OUTLOOK</span><h2>Forecast vs. recorded orders</h2><p>Bars use shared demo workspace data; choose a view to change the dish ordering.</p></div>
            <div className="forecast-range-switch" aria-label="Forecast view">
              {['All dishes', 'Highest demand', 'Lowest confidence'].map((value) => <button key={value} className={range === value ? 'selected' : ''} onClick={() => setRange(value)}>{value}</button>)}
            </div>
          </div>
          <div className="forecast-chart-legend"><span><i className="legend-forecast" /> Forecast demand</span><span><i className="legend-actual" /> Recorded orders</span></div>
          <div className="forecast-chart" role="img" aria-label="Bar chart comparing forecast demand with recorded orders by dish">
            {chartItems.map((item) => (
              <div className="forecast-chart-column" key={item.id}>
                <div className="forecast-chart-values"><span>{item.forecast}</span><small>{item.yesterday}</small></div>
                <div className="forecast-bars">
                  <div className="forecast-bar forecast-bar-demand" style={{ height: (item.forecast / chartScale * 100) + '%' }} />
                  <div className="forecast-bar forecast-bar-actual" style={{ height: (item.yesterday / chartScale * 100) + '%' }} />
                </div>
                <strong>{item.name.length > 13 ? item.name.slice(0, 12) + '…' : item.name}</strong><small>{item.category}</small>
              </div>
            ))}
          </div>
          <div className="forecast-chart-note"><TrendingUp size={16} /><span><strong>Use the range as a review view, not a time-series prediction.</strong> The current frontend has sample dish-level forecasts; it does not yet train a forecasting model or ingest live sales history.</span></div>
        </section>

        <section className="forecast-panel">
          <div className="forecast-panel-heading forecast-table-heading">
            <div><span className="forecast-section-label">DISH-LEVEL RECOMMENDATIONS</span><h2>What should the kitchen prepare?</h2><p>Compare forecast demand with current preparation and recommended batch quantities.</p></div>
            <span className="forecast-table-count">{visibleItems.length} of {items.length} dishes</span>
          </div>
          <div className="forecast-table-controls">
            <label className="forecast-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu items..." aria-label="Search menu items" /></label>
            <div className="forecast-risk-filters" aria-label="Filter by risk">
              {['All items', 'Low', 'Medium', 'High'].map((risk) => <button key={risk} onClick={() => setRiskFilter(risk)} className={riskFilter === risk ? 'selected' : ''}>{risk === 'All items' ? 'All items' : risk + ' risk'}</button>)}
            </div>
          </div>
          <div className="forecast-table-wrap">
            <table className="forecast-table">
              <thead><tr><th>Menu item</th><th>Recorded orders</th><th>Demand forecast</th><th>Prep incl. next batch</th><th>Forecast range</th><th>Waste risk</th><th>Signal</th></tr></thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><small>{item.category}</small></td>
                    <td>{item.yesterday}</td>
                    <td><strong>{item.forecast}</strong><small>portions</small></td>
                    <td><span className={'forecast-prep-value ' + (item.cooked > item.forecast ? 'prep-over' : item.cooked < item.forecast ? 'prep-under' : 'prep-balanced')}>{item.cooked}</span><small>{item.cooked > item.forecast ? (item.cooked - item.forecast) + ' above forecast' : item.cooked < item.forecast ? (item.forecast - item.cooked) + ' below forecast' : 'Matches forecast'}</small></td>
                    <td><strong>{item.low}–{item.high}</strong><small>{item.confidence}% confidence</small><div className="forecast-confidence-track"><span style={{ width: item.confidence + '%' }} /></div></td>
                    <td><span className={'forecast-risk-badge risk-' + item.wasteRisk.toLowerCase()}>{item.wasteRisk}</span></td>
                    <td><span className="forecast-signal"><span />{item.factor}</span></td>
                  </tr>
                ))}
                {visibleItems.length === 0 && <tr><td className="forecast-empty" colSpan={7}>No menu items match those filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="forecast-table-footer"><Info size={15} /><span>Suggested prep is a planning aid. Validate batch quantities against stock on hand and chef judgment before cooking.</span></div>
        </section>

        <div className="forecast-bottom-grid">
          <section className="forecast-panel forecast-weather-panel">
            <div className="forecast-mini-heading"><span className="forecast-mini-icon"><CloudRain size={18} /></span><div><span className="forecast-section-label">EXTERNAL FACTORS</span><h2>Inputs affecting the scenario</h2></div></div>
            <div className="forecast-factor-row"><span className="forecast-factor-icon"><CloudRain size={16} /></span><div><strong>{state.scenario.weather} weather</strong><small>Weather selection is shared with the External Factors page; its effect is simulated demo logic.</small></div><span className="forecast-factor-tag">Weather</span></div>
            <div className="forecast-factor-row"><span className="forecast-factor-icon"><Wind size={16} /></span><div><strong>Customer change: {state.scenario.customerChange > 0 ? '+' : ''}{state.scenario.customerChange}%</strong><small>Adjust the customer change in External Factors to explore demand scenarios.</small></div><span className="forecast-factor-tag">Footfall</span></div>
            <div className="forecast-factor-row"><span className="forecast-factor-icon"><CalendarDays size={16} /></span><div><strong>{state.scenario.holiday} holiday · {state.scenario.localEvent} local event</strong><small>Scenario values are illustrative and not connected to a live events feed.</small></div><span className="forecast-factor-tag">Events</span></div>
          </section>
          <section className="forecast-assist-panel">
            <div className="forecast-assist-heading"><span><Sparkles size={17} /> PLATEIQ ASSIST</span><span className="forecast-assist-status">DEMO</span></div>
            <h2>Make prep decisions with confidence.</h2>
            <p>Recalculate the shared demo plan after adjusting scenario inputs, then review the forecast range and available preparation batches before service.</p>
            <div className="forecast-assist-stat"><span>Highest waste risk</span><strong>{items.find((item) => item.wasteRisk === 'High')?.name ?? 'None flagged'}</strong></div>
            <button className="forecast-assist-action" onClick={() => { setRiskFilter('High'); setNotice('Showing dishes currently flagged as high risk.'); }}><span>Review high-risk dishes</span><ArrowRight size={16} /></button>
          </section>
        </div>
        <p className="forecast-disclaimer">Forecasting workspace preview · Sample values and scenario calculations only; no live POS feed or trained prediction model is connected.</p>
      </div>
    </AppShell>
  )
}
