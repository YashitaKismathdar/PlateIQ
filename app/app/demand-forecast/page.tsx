'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CloudRain,
  Download,
  Info,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Utensils,
  Wind,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'

type ForecastItem = {
  id: number
  name: string
  category: string
  yesterday: number
  forecast: number
  low: number
  high: number
  cooked: number
  unit: string
  confidence: number
  wasteRisk: 'Low' | 'Medium' | 'High'
  factor: string
}

const initialItems: ForecastItem[] = [
  { id: 1, name: 'Paneer Butter Masala', category: 'Main course', yesterday: 42, forecast: 48, low: 42, high: 55, cooked: 45, unit: 'portions', confidence: 92, wasteRisk: 'Low', factor: 'Weekend demand +12%' },
  { id: 2, name: 'Chicken Biryani', category: 'Main course', yesterday: 76, forecast: 84, low: 75, high: 94, cooked: 78, unit: 'portions', confidence: 95, wasteRisk: 'Medium', factor: 'Lunch orders trending up' },
  { id: 3, name: 'Veg Fried Rice', category: 'Main course', yesterday: 38, forecast: 34, low: 28, high: 40, cooked: 42, unit: 'portions', confidence: 88, wasteRisk: 'High', factor: 'Demand easing after rain' },
  { id: 4, name: 'Masala Dosa', category: 'Breakfast', yesterday: 63, forecast: 68, low: 60, high: 77, cooked: 60, unit: 'portions', confidence: 91, wasteRisk: 'Low', factor: 'Strong weekday pattern' },
  { id: 5, name: 'Dal Tadka', category: 'Main course', yesterday: 31, forecast: 35, low: 29, high: 41, cooked: 30, unit: 'portions', confidence: 84, wasteRisk: 'Medium', factor: 'Pairing rate is increasing' },
  { id: 6, name: 'Gulab Jamun', category: 'Dessert', yesterday: 29, forecast: 32, low: 26, high: 38, cooked: 36, unit: 'portions', confidence: 86, wasteRisk: 'Medium', factor: 'Dessert attach rate +6%' },
]

const days = [
  { day: 'Today', date: '09 Oct', demand: 218, actual: 204 },
  { day: 'Sat', date: '10 Oct', demand: 246, actual: null },
  { day: 'Sun', date: '11 Oct', demand: 264, actual: null },
  { day: 'Mon', date: '12 Oct', demand: 196, actual: null },
  { day: 'Tue', date: '13 Oct', demand: 205, actual: null },
  { day: 'Wed', date: '14 Oct', demand: 212, actual: null },
  { day: 'Thu', date: '15 Oct', demand: 224, actual: null },
]

const formatNumber = (value: number) => value.toLocaleString('en-IN')

export default function DemandForecastPage() {
  const [range, setRange] = useState('7 days')
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('All items')
  const [items, setItems] = useState(initialItems)
  const [applied, setApplied] = useState(false)
  const [notice, setNotice] = useState('')

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase())
    const matchesRisk = riskFilter === 'All items' || item.wasteRisk === riskFilter
    return matchesQuery && matchesRisk
  }), [items, query, riskFilter])

  const chartDays = range === '7 days' ? days : range === '14 days' ? [
    { day: 'Oct 9–10', date: 'Days 1–2', demand: 464, actual: 204 },
    { day: 'Oct 11–12', date: 'Days 3–4', demand: 460, actual: null },
    { day: 'Oct 13–14', date: 'Days 5–6', demand: 417, actual: null },
    { day: 'Oct 15–16', date: 'Days 7–8', demand: 448, actual: null },
    { day: 'Oct 17–18', date: 'Days 9–10', demand: 506, actual: null },
    { day: 'Oct 19–20', date: 'Days 11–12', demand: 402, actual: null },
    { day: 'Oct 21–22', date: 'Days 13–14', demand: 436, actual: null },
  ] : [
    { day: 'Week 1', date: 'Oct 9–15', demand: 1565, actual: 204 },
    { day: 'Week 2', date: 'Oct 16–22', demand: 1620, actual: null },
    { day: 'Week 3', date: 'Oct 23–29', demand: 1690, actual: null },
    { day: 'Week 4', date: 'Oct 30–Nov 5', demand: 1735, actual: null },
    { day: 'Week 5', date: 'Nov 6–12', demand: 1680, actual: null },
    { day: 'Week 6', date: 'Nov 13–19', demand: 1770, actual: null },
    { day: 'Week 7', date: 'Nov 20–26', demand: 1810, actual: null },
  ]
  const chartScale = range === '7 days' ? 280 : range === '14 days' ? 550 : 1900
  const totalDemand = items.reduce((sum, item) => sum + item.forecast, 0)
  const totalPrep = items.reduce((sum, item) => sum + item.cooked, 0)
  const excess = items.reduce((sum, item) => sum + Math.max(0, item.cooked - item.forecast), 0)
  const shortage = items.reduce((sum, item) => sum + Math.max(0, item.forecast - item.cooked), 0)
  const highRiskCount = items.filter((item) => item.wasteRisk === 'High').length

  function applyRecommendations() {
    setItems((current) => current.map((item) => ({
      ...item,
      cooked: item.forecast,
      wasteRisk: item.wasteRisk === 'High' ? 'Low' : item.wasteRisk,
    })))
    setApplied(true)
    setNotice('Suggested prep quantities applied to this demo plan.')
  }

  function resetPlan() {
    setItems(initialItems)
    setApplied(false)
    setNotice('Demo plan reset to its starting values.')
  }

  function exportForecast() {
    const rows = [
      ['Dish', 'Category', 'Yesterday sold', 'Forecast demand', 'Suggested prep', 'Lower range', 'Upper range', 'Confidence', 'Waste risk'],
      ...visibleItems.map((item) => [item.name, item.category, item.yesterday, item.forecast, item.cooked, item.low, item.high, item.confidence + '%', item.wasteRisk]),
    ]
    const csv = rows.map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'plateiq-demand-forecast.csv'
    link.click()
    URL.revokeObjectURL(url)
    setNotice('Forecast CSV exported.')
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
            <button className="forecast-button forecast-button-secondary" onClick={resetPlan}><RefreshCw size={16} /> Reset demo</button>
            <button className="forecast-button forecast-button-secondary" onClick={exportForecast}><Download size={16} /> Export CSV</button>
            <button className="forecast-button forecast-button-primary" onClick={applyRecommendations}><Sparkles size={16} /> {applied ? 'Recommendations applied' : 'Apply prep plan'}</button>
          </div>
        </div>

        {notice && <div className="forecast-notice" role="status"><Check size={16} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}

        <div className="forecast-context-row">
          <div className="forecast-context"><CalendarDays size={17} /><span><strong>Friday, 9 October</strong><small>Lunch + dinner service</small></span></div>
          <div className="forecast-context"><CloudRain size={17} /><span><strong>Light rain expected</strong><small>Weather factor included</small></span></div>
          <div className="forecast-context"><Utensils size={17} /><span><strong>6 menu items tracked</strong><small>Sample forecast data</small></span></div>
          <span className="forecast-demo-label"><Info size={13} /> Demo data</span>
        </div>

        <div className="forecast-kpi-grid">
          <article className="forecast-kpi">
            <div className="forecast-kpi-top"><span>Predicted portions</span><span className="forecast-kpi-icon"><Utensils size={17} /></span></div>
            <strong>{formatNumber(totalDemand)}</strong>
            <div className="forecast-kpi-foot"><span className="forecast-positive"><ArrowUpRight size={14} /> 8.6%</span> vs. previous comparable day</div>
          </article>
          <article className="forecast-kpi">
            <div className="forecast-kpi-top"><span>Suggested prep today</span><span className="forecast-kpi-icon"><Check size={17} /></span></div>
            <strong>{formatNumber(totalPrep)} <small>portions</small></strong>
            <div className="forecast-kpi-foot">Across {items.length} menu items</div>
          </article>
          <article className="forecast-kpi">
            <div className="forecast-kpi-top"><span>Potential over-prep</span><span className="forecast-kpi-icon forecast-icon-amber"><ArrowDownRight size={17} /></span></div>
            <strong>{formatNumber(excess)} <small>portions</small></strong>
            <div className="forecast-kpi-foot">{excess === 0 ? 'No excess prep in current plan' : 'Could become avoidable food waste'}</div>
          </article>
          <article className="forecast-kpi">
            <div className="forecast-kpi-top"><span>Shortage exposure</span><span className="forecast-kpi-icon forecast-icon-red"><AlertTriangle size={17} /></span></div>
            <strong>{formatNumber(shortage)} <small>portions</small></strong>
            <div className="forecast-kpi-foot">{highRiskCount} item flagged for waste risk</div>
          </article>
        </div>

        <section className="forecast-panel forecast-demand-panel">
          <div className="forecast-panel-heading">
            <div><span className="forecast-section-label">DEMAND OUTLOOK</span><h2>Expected kitchen demand</h2><p>Forecasted portions compared with recorded sales where available.</p></div>
            <div className="forecast-range-switch" aria-label="Forecast range">
              {['7 days', '14 days', '30 days'].map((value) => <button key={value} className={range === value ? 'selected' : ''} onClick={() => setRange(value)}>{value}</button>)}
            </div>
          </div>
          <div className="forecast-chart-legend"><span><i className="legend-forecast" /> Forecast demand</span><span><i className="legend-actual" /> Recorded sales</span></div>
          <div className="forecast-chart" role="img" aria-label={"Bar chart showing expected demand for " + range}>
            {chartDays.map((day, index) => (
              <div className="forecast-chart-column" key={day.date}>
                <div className="forecast-chart-values"><span>{day.demand}</span>{day.actual !== null && <small>{day.actual}</small>}</div>
                <div className="forecast-bars">
                  <div className="forecast-bar forecast-bar-demand" style={{ height: (day.demand / chartScale * 100) + '%' }} />
                  {day.actual !== null && <div className="forecast-bar forecast-bar-actual" style={{ height: (day.actual / chartScale * 100) + '%' }} />}
                </div>
                <strong>{day.day}</strong><small>{day.date}</small>
                {index === 2 && <span className="forecast-peak-tag">Peak</span>}
              </div>
            ))}
          </div>
          <div className="forecast-chart-note"><TrendingUp size={16} /><span><strong>Demand is trending higher in the selected outlook.</strong> Review prep quantities against recent sales and adjust for upcoming service conditions.</span></div>
        </section>

        <section className="forecast-panel">
          <div className="forecast-panel-heading forecast-table-heading">
            <div><span className="forecast-section-label">DISH-LEVEL RECOMMENDATIONS</span><h2>What should the kitchen prepare?</h2><p>Use the forecast range to balance shortage risk against avoidable surplus.</p></div>
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
              <thead><tr><th>Menu item</th><th>Sold yesterday</th><th>Demand forecast</th><th>Suggested prep</th><th>Confidence range</th><th>Waste risk</th><th>Signal</th></tr></thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><small>{item.category}</small></td>
                    <td>{item.yesterday}</td>
                    <td><strong>{item.forecast}</strong><small>portions</small></td>
                    <td><span className={'forecast-prep-value ' + (item.cooked > item.forecast ? 'prep-over' : item.cooked < item.forecast ? 'prep-under' : 'prep-balanced')}>{item.cooked}</span><small>{item.cooked > item.forecast ? (item.cooked - item.forecast) + ' over forecast' : item.cooked < item.forecast ? (item.forecast - item.cooked) + ' below forecast' : 'Matches forecast'}</small></td>
                    <td><strong>{item.low}–{item.high}</strong><small>{item.confidence}% confidence</small><div className="forecast-confidence-track"><span style={{ width: item.confidence + '%' }} /></div></td>
                    <td><span className={'forecast-risk-badge risk-' + item.wasteRisk.toLowerCase()}>{item.wasteRisk}</span></td>
                    <td><span className="forecast-signal"><span />{item.factor}</span></td>
                  </tr>
                ))}
                {visibleItems.length === 0 && <tr><td className="forecast-empty" colSpan={7}>No menu items match those filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="forecast-table-footer"><Info size={15} /><span>Suggested prep is a planning aid. Adjust for stock on hand, batch size, and your chef’s judgment before cooking.</span></div>
        </section>

        <div className="forecast-bottom-grid">
          <section className="forecast-panel forecast-weather-panel">
            <div className="forecast-mini-heading"><span className="forecast-mini-icon"><CloudRain size={18} /></span><div><span className="forecast-section-label">EXTERNAL FACTORS</span><h2>What may change demand?</h2></div></div>
            <div className="forecast-factor-row"><span className="forecast-factor-icon"><CloudRain size={16} /></span><div><strong>Light rain through lunch</strong><small>May shift walk-ins toward delivery and comfort-food dishes.</small></div><span className="forecast-factor-tag">Weather</span></div>
            <div className="forecast-factor-row"><span className="forecast-factor-icon"><Wind size={16} /></span><div><strong>Weekend footfall uplift</strong><small>Recent comparable weekends show stronger dinner traffic.</small></div><span className="forecast-factor-tag">Footfall</span></div>
            <div className="forecast-factor-row"><span className="forecast-factor-icon"><CalendarDays size={16} /></span><div><strong>No major local event recorded</strong><small>Add holidays, campus exams, or nearby events when known.</small></div><span className="forecast-factor-tag">Events</span></div>
          </section>
          <section className="forecast-assist-panel">
            <div className="forecast-assist-heading"><span><Sparkles size={17} /> PLATEIQ ASSIST</span><span className="forecast-assist-status">READY</span></div>
            <h2>Make prep decisions with confidence.</h2>
            <p>Review the dishes most likely to be over-prepared, then align quantities with the demand range and current inventory before service starts.</p>
            <div className="forecast-assist-stat"><span>Highest waste risk</span><strong>{items.find((item) => item.wasteRisk === 'High')?.name ?? 'None flagged'}</strong></div>
            <button className="forecast-assist-action" onClick={() => { setRiskFilter('High'); setNotice('Showing dishes currently flagged as high waste risk.'); }}><span>Review high-risk dishes</span><ArrowRight size={16} /></button>
          </section>
        </div>
        <p className="forecast-disclaimer">Forecasting workspace preview · Values shown are illustrative demo data, not live restaurant predictions.</p>
      </div>
    </AppShell>
  )
}
