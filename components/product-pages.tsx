'use client';
import { useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowRight, ArrowUpRight, Boxes, Check, CircleHelp, CloudRain, Sparkles, Zap } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { usePlateIQ } from './plateiq-state'
import { getCopilotContext, getDishOperationalContext, getForecastMetrics, getKitchenMetrics, getRestaurantMetrics } from '@/lib/selectors'
import { simulateScenario } from '@/lib/selectors'
import { wasteSummary } from '@/lib/waste-engine'

function Metric({label,value,detail,trend}:{label:string;value:string;detail:string;trend:string}){return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-dot"/></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className="positive">{trend}</span><span>{detail}</span></div></div>}
function Header({title,subtitle}:{title:string;subtitle:string}){return <div className="page-heading"><div><div className="eyebrow">TUESDAY, 24 JUNE 2025 <span className="separator">•</span> LUNCH SERVICE</div><h1>{title}</h1><p>{subtitle}</p></div></div>}
function Chart({title='Live demand monitor'}:{title?:string}) {
  const {state}=usePlateIQ();
  const forecast=getForecastMetrics(state);
  const data=[
    {time:'Baseline',actual:null,forecast:forecast?.baseline??0},
    {time:'Current',actual:state.demo.orders,forecast:null},
    {time:'Forecast',actual:null,forecast:forecast?.forecast??0},
  ];
  return <section className="panel demand-panel refined-demand-panel">
    <div className="panel-heading">
      <div><div className="section-kicker"><Activity/> {title}</div><h2>Demand at a glance</h2><p className="chart-subtitle">Compare the baseline, current orders, and projected demand.</p></div>
      <span className="chart-live-badge"><i/> Operational snapshot</span>
    </div>
    <div className="chart-legend"><span><i className="legend-line actual"/>Current orders</span><span><i className="legend-line forecast"/>Forecast</span><span><i className="legend-range-dot"/>Forecast range</span></div>
    <div className="chart-wrap refined-chart-wrap"><ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{top:12,right:8,left:-16,bottom:0}}>
        <CartesianGrid vertical={false} stroke="#E7EBE5" strokeDasharray="3 5"/>
        <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{fill:'#78867B',fontSize:11}} tickMargin={10}/>
        <YAxis tickLine={false} axisLine={false} tick={{fill:'#78867B',fontSize:11}} width={42}/>
        <Tooltip contentStyle={{border:'1px solid #e2e8df',borderRadius:12,boxShadow:'0 10px 30px rgba(25,48,30,.09)',fontSize:12}} formatter={(value,name)=>[typeof value==='number'?value.toLocaleString('en-IN')+' plates':value,name==='actual'?'Current orders':name==='forecast'?'Forecast':name==='rangeSize'?'Forecast range':name]}/>
        <Line dataKey="forecast" stroke="#D8942F" strokeWidth={2.5} strokeDasharray="6 5" dot={{r:4,fill:'#D8942F',stroke:'#fff',strokeWidth:2}} activeDot={{r:6}} connectNulls/>
        <Line dataKey="actual" stroke="#16834B" strokeWidth={3} dot={{r:5,fill:'#16834B',stroke:'#fff',strokeWidth:2}} activeDot={{r:7}} connectNulls={false}/>
      </LineChart>
    </ResponsiveContainer></div>
    <div className="chart-summary-row">
      <div><span>Current orders</span><strong>{state.demo.orders.toLocaleString('en-IN')} <small>plates</small></strong></div>
      <div><span>Forecast range</span><strong>{forecast?.lowerBound??0}–{forecast?.upperBound??0} <small>plates</small></strong></div>
      <div><span>Confidence</span><strong>{forecast?.confidence??0}<small>%</small></strong></div>
    </div>
  </section>
}

export function Overview(){
  const {state,dispatch}=usePlateIQ();
  const metrics=getRestaurantMetrics(state);
  const forecast=getForecastMetrics(state);
  const context=getDishOperationalContext(state,forecast?.dishId);
  const waste=wasteSummary(state.waste);
  const recommendation=state.recommendations.find(item=>item.dishId===forecast?.dishId);
  const kitchen=getKitchenMetrics(state);
  const activeBatches=state.batches.filter(batch=>batch.status!=='Completed').slice(0,4);
  const priorityEvents=state.events.slice(0,3);
  return <div className="page-body stitch-overview">
    <div className="stitch-overview-topline"><div><span className="stitch-live-dot"/><span>LIVE KITCHEN OS</span><span className="stitch-dot-separator">•</span><span>Dinner service workspace</span></div><span className="stitch-updated">AI insights connected</span></div>
    <section className="stitch-welcome">
      <div className="stitch-welcome-copy"><div className="stitch-eyebrow">TUESDAY SERVICE BRIEFING · HYDERABAD</div><h1>Good afternoon,<br/><em>Chef Marcus.</em></h1><p>Your kitchen is moving. Here's what needs attention before the next rush.</p><div className="stitch-welcome-meta"><span>↗ Demand confidence <strong>{forecast?.confidence??0}%</strong></span><span>☀ Clear service window</span><span>✦ {state.stations.length} active stations</span></div></div>
      <div className="stitch-welcome-actions"><div className="stitch-shift-pill"><span>ACTIVE SHIFT</span><strong>DINNER SERVICE</strong><small>Prep window · 17:00–22:00</small></div><div className="stitch-button-row"><button className="stitch-primary-action" onClick={()=>dispatch({type:'apply-plan'})}><Sparkles/> Apply preparation plan</button></div></div>
    </section>
    <section className="stitch-kpi-grid">
      <article className="stitch-kpi"><div className="stitch-kpi-heading"><span>PREDICTED DEMAND</span><b className="stitch-kpi-tag">LIVE PROJECTION</b></div><strong>{metrics.demand.toLocaleString('en-IN')}</strong><div className="stitch-kpi-foot"><span>Peak service forecast</span><span className="stitch-mini-bars"><i/><i/><i/><i/><i/><i/><i/></span></div></article>
      <article className="stitch-kpi"><div className="stitch-kpi-heading"><span>FOOD WASTE VARIANCE</span><b className="stitch-kpi-tag">TRACKING</b></div><strong>{metrics.wasteKg.toFixed(1)} <small>kg</small></strong><div className="stitch-kpi-foot"><span>₹{metrics.wasteCost.toLocaleString('en-IN')} estimated cost</span><span className="stitch-kpi-positive">↓ monitored</span></div></article>
      <article className="stitch-kpi"><div className="stitch-kpi-heading"><span>INVENTORY HEALTH</span><b className="stitch-kpi-tag stitch-kpi-tag-warn">{state.inventory.filter(i=>i.status==='Low Stock'||i.status==='Critical').length} LOW STOCK</b></div><strong>{state.inventory.length?Math.round(state.inventory.filter(i=>i.status!=='Critical'&&i.status!=='Low Stock').length/state.inventory.length*100):100}<small>%</small></strong><div className="stitch-kpi-foot"><span>{state.inventory.length} tracked ingredients</span><span>Stock signals</span></div></article>
      <article className="stitch-kpi"><div className="stitch-kpi-heading"><span>PREP & EXPEDITE PACE</span><b className="stitch-kpi-tag">KITCHEN FLOW</b></div><strong>{metrics.prepared.toLocaleString('en-IN')} <small>plates</small></strong><div className="stitch-kpi-foot"><span>Prepared against forecast</span><span className="stitch-kpi-positive">{kitchen.activeBatches.length} active batches</span></div></article>
    </section>
    <section className="stitch-main-grid">
      <div className="stitch-main-column">
        <div className="stitch-section-heading"><div><div className="stitch-eyebrow">INTELLIGENCE & PLANNING</div><h2>Dynamic service demand</h2><p>Forecast, preparation progress, and next-best actions in one view.</p></div><span className="stitch-section-status"><i/> Operational snapshot</span></div>
        <div className="stitch-chart-card"><Chart title="Demand & preparation forecast"/><div className="stitch-chart-footer"><div><span>Forecast accuracy</span><strong>{metrics.forecastAccuracy.toFixed(1)}%</strong></div><div><span>Projected demand</span><strong>{(forecast?.projectedDemand??metrics.demand).toLocaleString('en-IN')}</strong></div><div><span>Prep completion</span><strong>{metrics.demand?Math.min(100,Math.round(metrics.prepared/metrics.demand*100)):0}%</strong></div></div></div>
        <div className="stitch-section-heading stitch-section-heading-spaced"><div><div className="stitch-eyebrow">LIVE OPERATIONS</div><h2>Expedite pass · Brigade active</h2><p>Station status and progressive prep, at a glance.</p></div><span className="stitch-view-link"> {state.stations.length} stations <ArrowUpRight/></span></div>
        <div className="stitch-station-grid">{state.stations.slice(0,4).map((station,index)=><article className="stitch-station-card" key={station.id}><div className="stitch-station-head"><span className={`stitch-station-dot ${station.status==='At Risk'?'warn':station.status==='Busy'?'busy':''}`}/><span>{station.name}</span></div><strong>{station.status==='Busy'?'In service':station.status==='At Risk'?'Needs attention':'Ready'}</strong><div className="stitch-station-progress"><i style={{width:`${station.status==='Busy'?78:station.status==='At Risk'?92:42}%`}}/></div><small>{station.status==='At Risk'?'Review capacity':station.status==='Busy'?'Orders in progress':'Flow optimal'}</small></article>)}</div>
        <section className="stitch-list-card"><div className="stitch-list-heading"><div><h3>Progressive preparation queue</h3><p>Recommended batches based on current demand.</p></div><span>{activeBatches.length} active</span></div><div className="stitch-queue">{activeBatches.map(batch=>{const dish=state.dishes.find(item=>item.id===batch.dishId);return <div className="stitch-queue-row" key={batch.id}><div className="stitch-queue-number">#{batch.number}</div><div className="stitch-queue-name"><strong>{dish?.name??batch.dishId}</strong><small>{dish?.leadTimeMinutes??0} min lead time · Batch prep</small></div><div className="stitch-queue-quantity"><strong>{batch.quantity}</strong><small>plates</small></div><span className={`stitch-queue-status ${batch.status==='In Preparation'?'busy':''}`}>{batch.status}</span><button aria-label={`Advance batch ${batch.number}`} onClick={()=>dispatch({type:'batch',batchId:batch.id})}><ArrowRight/></button></div>})}</div></section>
      </div>
      <aside className="stitch-side-column">
        <section className="stitch-copilot-card"><div className="stitch-side-card-heading"><div><span className="stitch-sparkle">✦</span><h3>Chef Copilot</h3></div><span className="stitch-ai-pill">AI INSIGHTS</span></div><p className="stitch-side-intro">A short list of actions to keep service smooth and reduce avoidable waste.</p>{forecast&&context?<div className="stitch-recommendation"><div className="stitch-rec-status"><span className="stitch-station-dot warn"/> <strong>{state.demo.status==='Surge'?'Demand surge detected':'Preparation recommendation'}</strong></div><p>{recommendation?.description??`${context.dish.name} is being tracked against the live forecast.`}</p><div className="stitch-rec-metrics"><span>Forecast<strong>{forecast.forecast} plates</strong></span><span>Confidence<strong>{forecast.confidence}%</strong></span></div><button onClick={()=>dispatch({type:'apply-plan'})}>Apply prep plan <ArrowRight/></button></div>:<div className="stitch-empty-rec">No urgent preparation recommendations.</div>}{priorityEvents.map(event=><div className="stitch-event" key={event.id}><span className="stitch-event-dot"/><div><strong>{event.title}</strong><p>{event.description}</p><small>{event.timestamp}</small></div></div>)}<a className="stitch-text-link" href="/app/copilot">Open AI Copilot <ArrowUpRight/></a></section>
        <section className="stitch-waste-card"><div className="stitch-side-card-heading"><div><span className="stitch-sparkle">↗</span><h3>Waste analytics</h3></div><span className="stitch-good-pill">MONITORED</span></div><div className="stitch-waste-total"><strong>{waste.wasteKg.toFixed(1)} kg</strong><span>recorded waste</span></div><div className="stitch-waste-bar"><i style={{width:`${Math.min(100,metrics.wasteKg*5)}%`}}/></div><div className="stitch-waste-foot"><span>Estimated cost</span><strong>₹{metrics.wasteCost.toLocaleString('en-IN')}</strong></div><a className="stitch-text-link" href="/app/waste-intelligence">Review waste log <ArrowUpRight/></a></section>
        <section className="stitch-inventory-card"><div className="stitch-side-card-heading"><div><span className="stitch-sparkle">▦</span><h3>Inventory watch</h3></div><span className="stitch-kpi-tag stitch-kpi-tag-warn">{state.inventory.filter(i=>i.status==='Low Stock'||i.status==='Critical').length} FLAGS</span></div>{state.inventory.filter(i=>i.status==='Low Stock'||i.status==='Critical').slice(0,3).map(item=><div className="stitch-inventory-row" key={item.id}><span className="stitch-station-dot warn"/><div><strong>{item.name}</strong><small>{item.status} · {item.quantity} {item.unit}</small></div><ArrowUpRight/></div>)}{state.inventory.every(i=>i.status!=='Low Stock'&&i.status!=='Critical')&&<p className="stitch-no-flags">No low-stock items currently flagged.</p>}<a className="stitch-text-link" href="/app/inventory">Open inventory <ArrowUpRight/></a></section>
      </aside>
    </section>
  </div>
}

export function ProductPage({kind}:{kind:string}){const titles:Record<string,[string,string]>={'live-operations':['Live operations','A clear view of what is happening across the kitchen right now.'],'kitchen-planner':['Kitchen planner','Prepare progressively, with the next decision always visible.'],'demand-forecast':['Demand forecast','Probabilistic forecasts that improve as orders arrive.'],'inventory':['Inventory intelligence','Know what is running low before service is disrupted.'],'waste-intelligence':['Waste intelligence','Turn every avoided plate into measurable savings.'],'analytics':['Culinary insights','See how operational decisions compound over time.'],'what-if':['External factors','Understand how weather, local events, and demand shifts may affect service.'],'copilot':['Ask PlateIQ','Your AI kitchen operations assistant.']};const [title,subtitle]=titles[kind]||titles.analytics;const [change,setChange]=useState(0);const {state}=usePlateIQ();const metrics=getRestaurantMetrics(state);const kitchen=getKitchenMetrics(state);const waste=wasteSummary(state.waste);return <div className={`page-body stitch-workspace-page stitch-page-${kind}`}><Header title={title} subtitle={subtitle}/>{kind==='what-if'?<Simulator change={change} setChange={setChange}/>:kind==='copilot'?<Copilot/>:<><div className="metrics-grid"><Metric label="Forecast accuracy" value={`${metrics.forecastAccuracy.toFixed(1)}%`} detail="current confidence" trend="Derived"/><Metric label="Projected demand" value={metrics.projectedDemand.toLocaleString('en-IN')} detail="shared forecast" trend="Live"/><Metric label="Kitchen capacity" value={`${kitchen.capacity}%`} detail="station average" trend="Derived"/><Metric label="Food waste" value={`${metrics.wasteKg.toFixed(1)} kg`} detail="waste records" trend="Tracked"/><Metric label="Food cost savings" value={waste.potentialSavings===null?'—':`₹${waste.potentialSavings.toLocaleString('en-IN')}`} detail={waste.potentialSavings===null?'Baseline unavailable':'Derived' } trend="State"/></div><div className="dashboard-grid"><Chart title={kind==='live-operations'?'Live order velocity':'Forecast vs actual'}/><section className="panel"><div className="section-kicker"><Sparkles/> AI insight</div><h2>Make the next preparation decision with confidence.</h2><p className="muted-copy">Live state, forecast confidence, inventory, and kitchen capacity are available through the shared operational model.</p></section></div></>}</div>}


function Simulator({change,setChange}:{change:number;setChange:(value:number)=>void}) {
  const {state,dispatch}=usePlateIQ();
  const result=simulateScenario(state,{...state.scenario,customerChange:change});
  return <section className="panel data-panel">
    <div className="section-kicker"><Activity/> Scenario simulator</div>
    <h2>Model a change in customer demand</h2>
    <p className="muted-copy">Adjust expected customer demand and review the projected kitchen impact before applying a plan.</p>
    <label className="scenario-control">Customer demand change <strong>{change>0?'+':''}{change}%</strong><input type="range" min="-30" max="60" step="5" value={change} onChange={event=>setChange(Number(event.target.value))}/></label>
    <div className="metrics-grid">
      <Metric label="Projected demand" value={result.projectedDemand.toLocaleString('en-IN')} detail="plates across menu" trend="Scenario"/>
      <Metric label="Recommended prep" value={result.recommendedPreparation.toLocaleString('en-IN')} detail="additional plates" trend="Scenario"/>
      <Metric label="Stockout risk" value={result.stockoutRisk} detail="projected inventory" trend="Scenario"/>
      <Metric label="Projected waste" value={result.projectedWasteKg.toFixed(1)+" kg"} detail={`₹${Math.round(result.projectedWasteCost).toLocaleString('en-IN')} estimated cost`} trend="Scenario"/>
    </div>
    <div className="setting-row"><strong>AI explanation</strong><span>{result.explanation}</span></div>
    {result.ingredientPressure.length>0&&<div className="setting-row"><strong>Ingredients under pressure</strong><span>{result.ingredientPressure.join(', ')}</span></div>}
    <div className="heading-actions"><button className="outline-button" onClick={()=>{setChange(0);dispatch({type:'reset-scenario'})}}>Reset scenario</button><button className="primary-button" onClick={()=>{dispatch({type:'scenario',scenario:{customerChange:change}});dispatch({type:'apply-plan'})}}>Apply preparation plan <ArrowRight/></button></div>
  </section>
}

function Copilot() {
  const {state,dispatch}=usePlateIQ();
  const context=getCopilotContext(state);
  return <div className="dashboard-grid">
    <section className="panel">
      <div className="section-kicker"><Sparkles/> PlateIQ Copilot</div>
      <h2>Kitchen intelligence, grounded in live operational data.</h2>
      <p className="muted-copy">Recommendations update from demand forecasts, prep batches, inventory availability, and waste records.</p>
      <div className="setting-row"><span>Current orders</span><strong>{context.orders.toLocaleString('en-IN')}</strong></div>
      <div className="setting-row"><span>Projected demand</span><strong>{context.forecast?.projectedDemand??0} plates</strong></div>
      <div className="setting-row"><span>Forecast confidence</span><strong>{context.forecast?.confidence??0}%</strong></div>
      <div className="setting-row"><span>Recommended preparation</span><strong>{context.recommendedQuantity} plates</strong></div>
      <div className="setting-row"><span>Waste recorded</span><strong>{context.waste.wasteKg.toFixed(1)} kg</strong></div>
      <div className="setting-row"><span>Scenario</span><strong>{context.surge?'Demand surge':state.demo.status}</strong></div>
    </section>
    <section className="panel">
      <div className="section-kicker"><Zap/> Recommended next actions</div>
      {state.recommendations.length?state.recommendations.map(item=><article className="setting-row" key={item.id}><div><strong>{item.title}</strong><p className="muted-copy">{item.description}</p><small>{item.confidence}% confidence</small></div>{item.dishId&&state.batches.find(batch=>batch.dishId===item.dishId&&batch.status!=='Completed')&&<button className="text-button" onClick={()=>dispatch({type:'batch',batchId:state.batches.find(batch=>batch.dishId===item.dishId&&batch.status!=='Completed')!.id})}>{item.actionLabel??'Advance batch'}</button>}</article>):<p className="muted-copy">No active recommendations. Keep monitoring demand and stock levels.</p>}
      <div className="section-kicker"><Activity/> Recent operational events</div>
      {state.events.slice(0,5).map(event=><div className="setting-row" key={event.id}><div><strong>{event.title}</strong><p className="muted-copy">{event.description}</p></div><small>{event.timestamp}</small></div>)}
    </section>
  </div>
}
