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
  const lowStockItems=state.inventory.filter(item=>item.status==='Low'||item.status==='Critical');
  const inventoryHealth=state.inventory.length?Math.round((state.inventory.length-lowStockItems.length)/state.inventory.length*100):0;
  const topWaste=[...state.waste].sort((a,b)=>b.wasteKg-a.wasteKg).slice(0,2);
  const serviceLabel=state.demo.status==='Surge'?'Demand surge':state.demo.status==='Adjusting'?'Plan adjusting':'Monitoring';
  return <div className="page-body stitch-overview">
    <div className="stitch-overview-topline"><div><span className="stitch-live-dot"/><span>PLATEIQ KITCHEN OVERVIEW</span><span className="stitch-dot-separator">•</span><span>{state.restaurant.name} · service overview</span></div><span className="stitch-updated">SAMPLE DATA · LOCAL STATE</span></div>
    <section className="stitch-welcome">
      <div className="stitch-welcome-copy"><div className="stitch-eyebrow">KITCHEN SERVICE BRIEFING · {state.restaurant.city.toUpperCase()}</div><h1>Your kitchen,<br/><em>at a glance.</em></h1><p>Review demand, preparation progress, waste, and stock risks from the current PlateIQ sample dataset.</p><div className="stitch-welcome-meta"><span>↗ Forecast confidence <strong>{forecast?.confidence??0}%</strong></span><span>◷ {serviceLabel}</span><span>✦ {state.stations.length} configured stations</span></div></div>
      <div className="stitch-welcome-actions"><div className="stitch-shift-pill"><span>KITCHEN WORKSPACE</span><strong>Current service</strong><small>Shift times are not configured</small></div><div className="stitch-button-row"><button className="stitch-primary-action" onClick={()=>dispatch({type:'apply-plan'})}><Sparkles/> Apply preparation plan</button></div></div>
    </section>
    <section className="stitch-kpi-grid">
      <article className="stitch-kpi"><div className="stitch-kpi-heading"><span>PREDICTED DEMAND</span><b className="stitch-kpi-tag">CURRENT PROJECTION</b></div><strong>{metrics.demand.toLocaleString('en-IN')}</strong><div className="stitch-kpi-foot"><span>Projected plates </span><span className="stitch-mini-bars"><i/><i/><i/><i/><i/><i/><i/></span></div></article>
      <article className="stitch-kpi"><div className="stitch-kpi-heading"><span>FOOD WASTE VARIANCE</span><b className="stitch-kpi-tag">RECORDED TOTAL</b></div><strong>{metrics.wasteKg.toFixed(1)} <small>kg</small></strong><div className="stitch-kpi-foot"><span>₹{metrics.wasteCost.toLocaleString('en-IN')} estimated cost</span><span className="stitch-kpi-positive">Recorded total</span></div></article>
      <article className="stitch-kpi"><div className="stitch-kpi-heading"><span>INVENTORY HEALTH</span><b className="stitch-kpi-tag stitch-kpi-tag-warn">{lowStockItems.length} LOW STOCK</b></div><strong>{inventoryHealth}<small>%</small></strong><div className="stitch-kpi-foot"><span>{state.inventory.length} tracked ingredients</span><span>Stock signals</span></div></article>
      <article className="stitch-kpi"><div className="stitch-kpi-heading"><span>PREP & EXPEDITE PACE</span><b className="stitch-kpi-tag">KITCHEN FLOW</b></div><strong>{metrics.prepared.toLocaleString('en-IN')} <small>plates</small></strong><div className="stitch-kpi-foot"><span>Prepared against forecast</span><span className="stitch-kpi-positive">{kitchen.activeBatches.length} active batches</span></div></article>
    </section>
    <section className="stitch-main-grid">
      <div className="stitch-main-column">
        <div className="stitch-section-heading"><div><div className="stitch-eyebrow">INTELLIGENCE & PLANNING</div><h2>Dynamic service demand</h2><p>Current forecast, preparation progress, and operational next steps.</p></div><span className="stitch-section-status"><i/> Workspace snapshot</span></div>
        <div className="stitch-chart-card"><Chart title="Demand & preparation forecast"/><div className="stitch-chart-footer"><div><span>Model metric (current calculation)</span><strong>{metrics.forecastAccuracy.toFixed(1)}%</strong></div><div><span>Projected demand</span><strong>{(forecast?.projectedDemand??metrics.demand).toLocaleString('en-IN')}</strong></div><div><span>Prep completion</span><strong>{metrics.demand?Math.min(100,Math.round(metrics.prepared/metrics.demand*100)):0}%</strong></div></div></div>
        <div className="stitch-section-heading stitch-section-heading-spaced"><div><div className="stitch-eyebrow">KITCHEN OPERATIONS</div><h2>Kitchen stations</h2><p>Configured station status and capacity.</p></div><span className="stitch-view-link"> {state.stations.length} stations <ArrowUpRight/></span></div>
        <div className="stitch-station-grid">{state.stations.slice(0,4).map((station,index)=><article className="stitch-station-card" key={station.id}><div className="stitch-station-head"><span className={`stitch-station-dot ${station.status==='At Risk'?'warn':station.status==='Busy'?'busy':''}`}/><span>{station.name}</span></div><strong>{station.status==='Busy'?'In service':station.status==='At Risk'?'Needs attention':'Ready'}</strong><div className="stitch-station-progress"><i style={{width:`${station.capacity}%`}}/></div><small>{station.status==='At Risk'?'Review capacity':station.status==='Busy'?'Orders in progress':'Flow optimal'}</small></article>)}</div>
        <section className="stitch-list-card"><div className="stitch-list-heading"><div><h3>Progressive preparation queue</h3><p>Recommended batches based on current demand.</p></div><span>{activeBatches.length} active</span></div><div className="stitch-queue">{activeBatches.map(batch=>{const dish=state.dishes.find(item=>item.id===batch.dishId);return <div className="stitch-queue-row" key={batch.id}><div className="stitch-queue-number">#{batch.number}</div><div className="stitch-queue-name"><strong>{dish?.name??batch.dishId}</strong><small>{dish?.leadTimeMinutes??0} min lead time · Batch prep</small></div><div className="stitch-queue-quantity"><strong>{batch.quantity}</strong><small>plates</small></div><span className={`stitch-queue-status ${batch.status==='In Preparation'?'busy':''}`}>{batch.status}</span><button aria-label={`Advance batch ${batch.number}`} onClick={()=>dispatch({type:'batch',batchId:batch.id})}><ArrowRight/></button></div>})}</div></section>
      </div>
      <aside className="stitch-side-column">
        <section className="stitch-copilot-card"><div className="stitch-side-card-heading"><div><span className="stitch-sparkle">✦</span><h3>Chef Copilot</h3></div><span className="stitch-ai-pill">RULE-BASED GUIDANCE</span></div><p className="stitch-side-intro">A short list of actions to keep service smooth and reduce avoidable waste.</p>{forecast&&context?<div className="stitch-recommendation"><div className="stitch-rec-status"><span className="stitch-station-dot warn"/> <strong>{state.demo.status==='Surge'?'Demand surge detected':'Preparation recommendation'}</strong></div><p>{recommendation?.description??`${context.dish.name} is being tracked against the live forecast.`}</p><div className="stitch-rec-metrics"><span>Forecast<strong>{forecast.forecast} plates</strong></span><span>Confidence<strong>{forecast.confidence}%</strong></span></div><button onClick={()=>dispatch({type:'apply-plan'})}>Apply prep plan <ArrowRight/></button></div>:<div className="stitch-empty-rec">No urgent preparation recommendations.</div>}{priorityEvents.map(event=><div className="stitch-event" key={event.id}><span className="stitch-event-dot"/><div><strong>{event.title}</strong><p>{event.description}</p><small>{event.timestamp}</small></div></div>)}<a className="stitch-text-link" href="/app/copilot">Open AI Copilot <ArrowUpRight/></a></section>
        <section className="stitch-waste-card"><div className="stitch-side-card-heading"><div><span className="stitch-sparkle">↗</span><h3>Waste analytics</h3></div><span className="stitch-good-pill">RECORDED ENTRIES</span></div><div className="stitch-waste-total"><strong>{waste.wasteKg.toFixed(1)} kg</strong><span>recorded waste</span></div><div className="stitch-waste-bar"><i style={{width:`${waste.wasteKg?Math.min(100,(topWaste[0]?.wasteKg/waste.wasteKg)*100):0}%`}}/></div><div className="stitch-waste-foot"><span>Estimated recorded cost</span><strong>₹{metrics.wasteCost.toLocaleString('en-IN')}</strong></div><div className="stitch-top-waste"><span>Highest recorded waste</span>{topWaste.map(record=><div key={record.id}><strong>{state.dishes.find(dish=>dish.id===record.dishId)?.name??record.dishId}</strong><span>{record.wasteKg.toFixed(1)} kg</span></div>)}</div><a className="stitch-text-link" href="/app/waste-intelligence">Review waste log <ArrowUpRight/></a></section>
        <section className="stitch-inventory-card"><div className="stitch-side-card-heading"><div><span className="stitch-sparkle">▦</span><h3>Inventory watch</h3></div><span className="stitch-kpi-tag stitch-kpi-tag-warn">{lowStockItems.length} FLAGS</span></div>{lowStockItems.slice(0,3).map(item=><div className="stitch-inventory-row" key={item.id}><span className="stitch-station-dot warn"/><div><strong>{item.name}</strong><small>{item.status} · {item.currentStock} {item.unit}</small></div><ArrowUpRight/></div>)}{lowStockItems.length===0&&<p className="stitch-no-flags">No low-stock items currently flagged.</p>}<a className="stitch-text-link" href="/app/inventory">Open inventory <ArrowUpRight/></a></section>
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
  const [prompt,setPrompt]=useState('');
  const [messages,setMessages]=useState<{role:'user'|'assistant';text:string}[]>([]);
  const [notice,setNotice]=useState('');
  const lowStock=state.inventory.filter(item=>item.status==='Low'||item.status==='Critical');
  const activeBatches=state.batches.filter(batch=>batch.status!=='Completed');
  const topWaste=[...state.waste].sort((a,b)=>b.wasteKg-a.wasteKg).slice(0,2);
  const answerQuestion=(raw:string)=>{
    const question=raw.trim();
    if(!question)return;
    const q=question.toLowerCase();
    let answer='';
    if(/stock|ingredient|reorder|inventory|shortage|supplier/.test(q)){
      answer=lowStock.length
        ? 'Inventory needs attention: '+lowStock.slice(0,4).map(item=>item.name+' ('+item.status+', '+item.currentStock+' '+item.unit+' left; about '+item.daysLeft.toFixed(1)+' days of coverage)').join('; ')+'. Review the Inventory page before committing to additional prep.'
        : 'No ingredients are currently marked Low or Critical in this sample inventory. Check the stock register before placing orders.';
    }else if(/waste|wasted|surplus|spoil/.test(q)){
      answer=topWaste.length
        ? 'Recorded waste is '+context.waste.wasteKg.toFixed(1)+' kg (estimated cost ₹'+Math.round(context.waste.wasteCost).toLocaleString('en-IN')+'). Largest recorded contributors: '+topWaste.map(item=>(state.dishes.find(d=>d.id===item.dishId)?.name??item.dishId)+' ('+item.wasteKg.toFixed(1)+' kg)').join(', ')+'. These are recorded entries, not a live waste sensor feed.'
        : 'There are no waste entries in the current local workspace state. Record waste on the Waste Management page to start identifying repeat causes.';
    }else if(/prep|cook|batch|make|prepare|dish|menu|demand|orders/.test(q)){
      const forecast=context.forecast;
      answer=(context.dish?.name??'The selected dish')+': current recorded orders are '+context.orders+' plates; projected demand is '+(forecast?.projectedDemand??0)+' plates (forecast range '+(forecast?.lowerBound??0)+'–'+(forecast?.upperBound??0)+', '+(forecast?.confidence??0)+'% confidence). Suggested preparation is '+context.recommendedQuantity+' plates. '+(context.batch?'Next batch status: '+context.batch.status+'. ':'')+(context.batchImpact?.shortages?.length?'Check ingredients first: '+context.batchImpact.shortages.map(item=>item.name).join(', ')+'.':'No ingredient shortage is flagged for this suggested quantity by the current model.')+' Treat this as a planning aid, not a guarantee.';
    }else if(/event|weather|rain|holiday|external|traffic/.test(q)){
      answer='External conditions are not connected to a live weather or events feed yet. Open External Factors to adjust the available scenario inputs, then review the projected demand, stockout risk, and waste estimate before applying a preparation plan.';
    }else{
      answer='Here is the current service snapshot: '+context.orders+' orders recorded so far; projected demand '+(context.forecast?.projectedDemand??0)+' plates with '+(context.forecast?.confidence??0)+'% forecast confidence; suggested preparation '+context.recommendedQuantity+' plates; '+lowStock.length+' ingredients marked Low or Critical; and '+context.waste.wasteKg.toFixed(1)+' kg of recorded waste. Ask about preparation, inventory risks, waste, or external conditions for a focused breakdown.';
    }
    setMessages(current=>[...current,{role:'user',text:question},{role:'assistant',text:answer}]);
    setPrompt('');
    setNotice('Answer generated from the current local sample data.');
  };
  return <div className="copilot-workspace">
    <div className="copilot-demo-notice"><span className="copilot-demo-pulse"/> COPILOT STATUS <span>Answers are generated from PlateIQ's local workspace state. No live AI model or external data feed is connected.</span></div>
    <div className="copilot-hero">
      <div className="copilot-hero-copy"><span className="copilot-overline"><Sparkles size={14}/> KITCHEN DECISION SUPPORT</span><h2>Good service starts with<br/><em>the right next question.</em></h2><p>Explore demand, preparation, stock pressure, and recorded waste in one place.</p></div>
      <div className="copilot-hero-stat"><span>Forecast confidence</span><strong>{context.forecast?.confidence??0}<small>%</small></strong><small>Current forecast</small></div>
    </div>
    <div className="copilot-content-grid">
      <section className="panel copilot-chat-panel">
        <div className="copilot-panel-heading"><div className="copilot-assistant-mark"><Sparkles size={18}/></div><div><h3>Ask PlateIQ</h3><p>Operational answers based on current workspace data</p></div><span className="copilot-mode-pill">LOCAL GUIDANCE</span></div>
        <div className="copilot-chat-body" aria-live="polite">
          <div className="copilot-message assistant"><span className="copilot-message-avatar"><Sparkles size={14}/></span><div><strong>PlateIQ assistant</strong><p>Hi! I can help you interpret this service snapshot. Ask what to prepare next, which ingredients need attention, or where recorded waste is coming from.</p><small>Uses current local workspace state</small></div></div>
          {messages.map((message,index)=><div className={'copilot-message '+message.role} key={index}>{message.role==='assistant'&&<span className="copilot-message-avatar"><Sparkles size={14}/></span>}<div>{message.role==='assistant'&&<strong>PlateIQ assistant</strong>}<p>{message.text}</p>{message.role==='assistant'&&<small>Derived from local sample data</small>}</div></div>)}
        </div>
        <div className="copilot-prompt-area">
          <div className="copilot-suggestion-list">{['What should we prepare next?','Which ingredients are at risk?','Where is waste highest?','How could weather affect service?'].map(item=><button type="button" key={item} onClick={()=>answerQuestion(item)}>{item}<ArrowRight size={13}/></button>)}</div>
          <form className="copilot-prompt-form" onSubmit={event=>{event.preventDefault();answerQuestion(prompt)}}><label className="copilot-sr-only" htmlFor="copilot-question">Ask PlateIQ a question</label><input id="copilot-question" value={prompt} onChange={event=>setPrompt(event.target.value)} placeholder="Ask about prep, stock, waste, or demand…" maxLength={500}/><button type="submit" disabled={!prompt.trim()} aria-label="Send question"><ArrowRight size={17}/></button></form>
          {notice&&<p className="copilot-feedback" role="status">{notice}</p>}
        </div>
      </section>
      <aside className="copilot-side-column">
        <section className="panel copilot-context-panel"><div className="copilot-side-heading"><span className="copilot-side-icon"><Activity size={16}/></span><div><h3>Service snapshot</h3><p>Current shared local workspace state</p></div></div>
          <div className="copilot-context-row"><span>Current orders</span><strong>{context.orders.toLocaleString('en-IN')} plates</strong></div>
          <div className="copilot-context-row"><span>Projected demand</span><strong>{context.forecast?.projectedDemand??0} plates</strong></div>
          <div className="copilot-context-row"><span>Suggested preparation</span><strong>{context.recommendedQuantity} plates</strong></div>
          <div className="copilot-context-row"><span>Recorded waste</span><strong>{context.waste.wasteKg.toFixed(1)} kg</strong></div>
          <div className="copilot-context-row"><span>Stock alerts</span><strong className={lowStock.length?'copilot-value-warn':''}>{lowStock.length} ingredients</strong></div>
          <div className="copilot-context-row"><span>Service status</span><strong>{context.surge?'Demand surge':state.demo.status}</strong></div>
          <Link className="copilot-inline-link" href="/app/demand-forecast">Review demand forecast <ArrowUpRight size={14}/></Link>
        </section>
        <section className="panel copilot-actions-panel"><div className="copilot-side-heading"><span className="copilot-side-icon"><Zap size={16}/></span><div><h3>Recommended actions</h3><p>Based on current operational signals</p></div></div>
          {lowStock.length>0&&<div className="copilot-action-card"><span className="copilot-action-priority">CHECK STOCK</span><strong>{lowStock.length} ingredients need review</strong><p>{lowStock.slice(0,3).map(item=>item.name).join(', ')}{lowStock.length>3?' and more':''}</p><Link href="/app/inventory">Open inventory <ArrowRight size={13}/></Link></div>}
          {context.recommendedQuantity>0&&<div className="copilot-action-card"><span className="copilot-action-priority copilot-priority-green">PREPARATION</span><strong>Review the next batch</strong><p>{context.dish?.name??'Menu item'} · suggested {context.recommendedQuantity} plates.</p>{context.batch&&<button type="button" onClick={()=>{dispatch({type:'batch',batchId:context.batch!.id});setNotice('Batch action sent to the shared local workspace state.')}} disabled={!context.batch||context.batch.status==='Completed'}>{context.batch?.status==='Recommended'?'Start recommended batch':context.batch?.status==='In Preparation'?'Advance preparation batch':'No active batch'} <ArrowRight size={13}/></button>}<Link href="/app/kitchen-planner">Open kitchen planner <ArrowUpRight size={13}/></Link></div>}
          {topWaste.length>0&&<div className="copilot-action-card"><span className="copilot-action-priority">WASTE WATCH</span><strong>Review recorded waste</strong><p>{topWaste.map(item=>state.dishes.find(d=>d.id===item.dishId)?.name??item.dishId).join(', ')}</p><Link href="/app/waste-intelligence">Open waste management <ArrowRight size={13}/></Link></div>}
          {lowStock.length===0&&context.recommendedQuantity<=0&&topWaste.length===0&&<p className="muted-copy">No priority action is currently surfaced by the sample data.</p>}
        </section>
        <section className="copilot-limits-note"><CircleHelp size={15}/><p>Copilot is a frontend prototype right now. Connect a backend AI service and verified live data to enable open-ended AI responses.</p></section>
      </aside>
    </div>
  </div>
}


export function ForecastingPage() {
  const { state, dispatch } = usePlateIQ()
  const [period, setPeriod] = useState<'Lunch' | 'Dinner'>('Lunch')
  const forecastTotal = state.dishes.reduce((sum, dish) => sum + dish.forecast, 0)
  const actualTotal = state.dishes.reduce((sum, dish) => sum + dish.actualOrders, 0)
  const prepTotal = state.dishes.reduce((sum, dish) => sum + Math.max(0, Math.ceil((dish.forecast - dish.prepared) / Math.max(1, dish.batchSize)) * Math.max(1, dish.batchSize)), 0)
  const confidence = state.dishes.length ? Math.round(state.dishes.reduce((sum, dish) => sum + dish.confidence, 0) / state.dishes.length) : 0
  const gap = forecastTotal - actualTotal
  const maxDemand = Math.max(1, ...state.dishes.map(dish => Math.max(dish.forecast, dish.actualOrders)))
  return <div className="page-body stitch-workspace-page stitch-forecasting-page">
    <div className="stitch-overview-topline"><div><span className="stitch-live-dot"/><span>PLATEIQ INTELLIGENCE</span><span className="stitch-dot-separator">•</span><span>Demand planning</span></div><span className="stitch-updated">SAMPLE DATA · LOCAL STATE</span></div>
    <section className="stitch-forecast-hero">
      <div><div className="stitch-eyebrow">FORECASTING WORKSPACE · {state.restaurant.name.toUpperCase()}</div><h1>Plan ahead.<br/><em>Waste less.</em></h1><p>Turn your demand outlook into practical preparation decisions for each menu item.</p></div>
      <div className="stitch-forecast-controls"><span className="stitch-forecast-label">SERVICE PERIOD</span><div className="stitch-forecast-toggle"><button className={period==='Lunch'?'selected':''} onClick={()=>setPeriod('Lunch')}>Lunch</button><button className={period==='Dinner'?'selected':''} onClick={()=>setPeriod('Dinner')}>Dinner</button></div><span className="stitch-forecast-note">Current forecast · {period} service</span></div>
    </section>
    <section className="stitch-forecast-kpis">
      <article><span>FORECAST DEMAND</span><strong>{forecastTotal.toLocaleString('en-IN')} <small>plates</small></strong><p>Projected across {state.dishes.length} menu items</p></article>
      <article><span>ALREADY ORDERED</span><strong>{actualTotal.toLocaleString('en-IN')} <small>plates</small></strong><p>Current order count</p></article>
      <article><span>PREP TO PLAN</span><strong>{prepTotal.toLocaleString('en-IN')} <small>plates</small></strong><p>Suggested remaining batch quantities</p></article>
      <article><span>MODEL CONFIDENCE</span><strong>{confidence}<small>%</small></strong><p>Average menu-item confidence</p></article>
    </section>
    <section className="stitch-forecast-layout"><div className="stitch-forecast-main">
      <section className="stitch-forecast-chart-card"><div className="stitch-section-heading"><div><div className="stitch-eyebrow">DEMAND OUTLOOK</div><h2>Forecast vs. current orders</h2><p>Compare expected demand with orders recorded in the current workspace workspace.</p></div><span className="stitch-section-status"><i/>{gap>=0?gap.toLocaleString('en-IN')+' plates to forecast':Math.abs(gap).toLocaleString('en-IN')+' above forecast'}</span></div>
      <div className="stitch-forecast-bars">{state.dishes.map(dish=><div className="stitch-forecast-bar-row" key={dish.id}><div className="stitch-forecast-bar-name"><strong>{dish.name}</strong><span>{dish.category}</span></div><div className="stitch-forecast-bar-track"><i className="forecast-bar" style={{width:Math.max(3,dish.forecast/maxDemand*100)+'%'}}/><i className="actual-bar" style={{width:Math.max(2,dish.actualOrders/maxDemand*100)+'%'}}/></div><div className="stitch-forecast-bar-values"><strong>{dish.forecast.toLocaleString('en-IN')}</strong><span>{dish.actualOrders.toLocaleString('en-IN')} actual</span></div></div>)}</div>
      <div className="stitch-forecast-legend"><span><i className="forecast-key"/>Forecast</span><span><i className="actual-key"/>Current orders</span></div></section>
      <section className="stitch-forecast-table-card"><div className="stitch-section-heading"><div><div className="stitch-eyebrow">MENU-LEVEL RECOMMENDATIONS</div><h2>Preparation plan</h2><p>Suggested quantities based on each dish's forecast and current prep.</p></div><button className="stitch-forecast-apply" onClick={()=>dispatch({type:'apply-plan'})}><Sparkles/> Apply prep plan</button></div>
      <div className="stitch-forecast-table-wrap"><table className="stitch-forecast-table"><thead><tr><th>Menu item</th><th>Forecast range</th><th>Prepared</th><th>Recommended batch</th><th>Confidence</th></tr></thead><tbody>{state.dishes.map(dish=>{const batch=Math.max(0,Math.ceil((dish.forecast-dish.prepared)/Math.max(1,dish.batchSize))*Math.max(1,dish.batchSize));return <tr key={dish.id}><td><strong>{dish.name}</strong><small>{dish.category} · {dish.leadTimeMinutes} min lead</small></td><td>{dish.lowerBound}–{dish.upperBound}</td><td>{dish.prepared} plates</td><td><strong>{batch} plates</strong></td><td><span className="stitch-forecast-confidence">{dish.confidence}%</span></td></tr>})}</tbody></table></div></section>
    </div><aside className="stitch-forecast-side">
      <section className="stitch-forecast-insight"><div className="stitch-side-card-heading"><div><span className="stitch-sparkle">✦</span><h3>Planning insight</h3></div><span className="stitch-ai-pill">CURRENT</span></div><p>{gap>0?'The current forecast is '+gap.toLocaleString('en-IN')+' plates above recorded orders. Use the dish-level preparation plan to stage batches progressively.':gap<0?'Recorded orders are '+Math.abs(gap).toLocaleString('en-IN')+' plates above the current forecast. Review high-demand dishes and available stock before the next batch.':'Recorded orders currently match the forecast total.'}</p><div className="stitch-forecast-insight-metrics"><div><span>Forecast total</span><strong>{forecastTotal.toLocaleString('en-IN')} plates</strong></div><div><span>Current orders</span><strong>{actualTotal.toLocaleString('en-IN')} plates</strong></div></div><a className="stitch-text-link" href="/app/kitchen-planner">Open kitchen planner <ArrowUpRight/></a></section>
      <section className="stitch-forecast-insight"><div className="stitch-side-card-heading"><div><span className="stitch-sparkle">↗</span><h3>Confidence guide</h3></div></div><p>Confidence reflects the current model's per-dish estimate. Treat it as a planning signal, not a guarantee of actual demand.</p><div className="stitch-confidence-scale"><span><i className="high"/> 80–100% · Higher</span><span><i className="medium"/> 60–79% · Moderate</span><span><i className="low"/> Below 60% · Review</span></div></section>
    </aside></section>
  </div>
}
