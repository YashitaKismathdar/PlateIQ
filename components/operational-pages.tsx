'use client'
import { useMemo, useState } from 'react'
import { Check, Package, Sparkles, AlertTriangle } from 'lucide-react'
import { usePlateIQ, usePlateIQMetrics } from './plateiq-state'
import { wasteSummary } from '@/lib/waste-engine'
import { getAnalyticsMetrics, getDishOperationalContext, getKitchenMetrics } from '@/lib/selectors'

function PageFrame({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){const pageClass=title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");return <div className={`page-body stitch-workspace-page stitch-page-${pageClass}`}><div className="stitch-page-intro"><div><div className="stitch-page-kicker"><span className="stitch-live-dot"/> PLATEIQ INTELLIGENCE <span className="separator">/</span> LIVE WORKSPACE</div><h1>{title}</h1><p>{subtitle}</p></div><div className="stitch-page-status"><span className="stitch-live-dot"/> Systems operational</div></div>{children}</div>}
function Kpi({label,value,detail}:{label:string;value:string;detail:string}){return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-dot"/></div><div className="metric-value">{value}</div><div className="metric-bottom"><span>{detail}</span></div></div>}
function Status({children}:{children:React.ReactNode}){return <span className="status-badge">{children}</span>}
export function InventoryPage(){
 const {state,dispatch}=usePlateIQ();
 const [filter,setFilter]=useState('All');
 const [query,setQuery]=useState('');
 const [notice,setNotice]=useState('');
 const items=state.inventory;
 const rows=items.filter(item=>(filter==='All'||item.status===filter)&&item.name.toLowerCase().includes(query.trim().toLowerCase()));
 const critical=items.filter(item=>item.status==='Critical');
 const low=items.filter(item=>item.status==='Low');
 const totalValue=items.reduce((sum,item)=>sum+item.currentStock*item.unitCost,0);
 const averageDays=items.length?items.reduce((sum,item)=>sum+item.daysLeft,0)/items.length:0;
 const reorderItems=items.filter(item=>item.currentStock<=item.reorderPoint);
 const exportCsv=()=>{
  const header=['Ingredient','Current stock','Unit','Status','Reorder point','Daily usage','Days left','Unit cost INR','Stock value INR','Order state','Trend'];
  const lines=items.map(item=>[item.name,item.currentStock,item.unit,item.status,item.reorderPoint,item.dailyUsage,item.daysLeft,item.unitCost,(item.currentStock*item.unitCost).toFixed(2),item.orderStatus,item.trend]);
  const csv=[header,...lines].map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');link.href=url;link.download='plateiq-inventory.csv';link.click();URL.revokeObjectURL(url);
  setNotice('Inventory CSV exported.');
 };
 const stockLevel=(item:typeof items[number])=>Math.min(100,Math.round(item.currentStock/Math.max(item.reorderPoint*2,1)*100));
 const statusClass=(status:string)=>status==='Critical'?'inventory-status-critical':status==='Low'?'inventory-status-low':'inventory-status-healthy';
 return <PageFrame title="Inventory intelligence" subtitle="Keep ingredients ready, catch stock risks early, and track replenishment in one place.">
  <div className="inventory-demo-banner"><span className="inventory-demo-dot"/> DEMO INVENTORY <span>Changes update PlateIQ's shared local demo state. No supplier or POS system is connected.</span></div>
  {notice&&<div className="inventory-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></div>}
  <div className="metrics-grid inventory-metrics">
   <Kpi label="Ingredients tracked" value={items.length.toString()} detail="in this demo inventory"/>
   <Kpi label="Low stock" value={low.length.toString()} detail="below healthy coverage"/>
   <Kpi label="Critical stock" value={critical.length.toString()} detail="urgent replenishment risk"/>
   <Kpi label="Average coverage" value={averageDays.toFixed(1)+' days'} detail="based on daily usage"/>
   <Kpi label="Stock value" value={'₹'+Math.round(totalValue).toLocaleString('en-IN')} detail="estimated current value"/>
  </div>
  <div className="inventory-workspace-grid">
   <section className="panel inventory-risk-panel">
    <div className="inventory-section-heading"><div><span className="inventory-section-kicker">NEEDS ATTENTION</span><h2>Replenishment queue</h2><p>Ingredients at or below their reorder point.</p></div><span className="inventory-count-pill">{reorderItems.length} items</span></div>
    {reorderItems.length===0?<div className="inventory-empty">All ingredients are above their reorder points.</div>:<div className="inventory-reorder-list">{reorderItems.slice(0,5).map(item=><div className="inventory-reorder-row" key={item.id}><div className={'inventory-ingredient-avatar '+statusClass(item.status)}><Package size={16}/></div><div className="inventory-reorder-main"><strong>{item.name}</strong><small>{item.currentStock.toFixed(1)} {item.unit} on hand · reorder at {item.reorderPoint} {item.unit}</small></div><span className={'inventory-status-pill '+statusClass(item.status)}>{item.status}</span><button className="inventory-inline-action" onClick={()=>{dispatch({type:'mark-ordered',itemId:item.id});setNotice(item.name+' marked as ordered in demo state.')}} disabled={item.orderStatus==='Ordered'}>{item.orderStatus==='Ordered'?'Ordered':'Mark ordered'}</button></div>)}</div>}
   </section>
   <section className="panel inventory-coverage-panel">
    <div className="inventory-section-heading"><div><span className="inventory-section-kicker">STOCK HEALTH</span><h2>Coverage snapshot</h2><p>Current quantity compared with twice the reorder point.</p></div></div>
    <div className="inventory-coverage-list">{items.filter(item=>item.status!=='Healthy').slice(0,4).map(item=><div className="inventory-coverage-row" key={item.id}><div><strong>{item.name}</strong><span>{item.daysLeft.toFixed(1)} days left</span></div><div className="inventory-stock-track"><span className={statusClass(item.status)} style={{width:stockLevel(item)+'%'}}/></div><small>{item.currentStock.toFixed(1)} {item.unit}</small></div>)}
    {items.every(item=>item.status==='Healthy')&&<div className="inventory-empty">No low-stock items right now.</div>}</div>
    <div className="inventory-coverage-foot"><span>Estimated inventory value</span><strong>₹{Math.round(totalValue).toLocaleString('en-IN')}</strong></div>
   </section>
  </div>
  <section className="panel data-panel inventory-table-panel">
   <div className="inventory-section-heading inventory-table-heading"><div><span className="inventory-section-kicker">STOCK REGISTER</span><h2>All ingredients</h2><p>Adjust counts, track order status, and receive deliveries.</p></div><button className="inventory-export-button" onClick={exportCsv}><Package size={15}/> Export CSV</button></div>
   <div className="inventory-table-controls"><label className="inventory-search"><span>⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search ingredients..." aria-label="Search ingredients"/></label><div className="inventory-filter-tabs" aria-label="Filter by stock status">{['All','Healthy','Low','Critical'].map(option=><button key={option} className={filter===option?'selected':''} onClick={()=>setFilter(option)}>{option}{option==='All'?<span>{items.length}</span>:<span>{items.filter(item=>item.status===option).length}</span>}</button>)}</div></div>
   <div className="table-wrap inventory-table-wrap"><table className="inventory-table"><thead><tr><th>Ingredient</th><th>Available</th><th>Stock health</th><th>Coverage</th><th>Stock value</th><th>Order status</th><th>Quick adjust</th><th>Action</th></tr></thead><tbody>{rows.map(item=><tr key={item.id}><td><div className="inventory-table-ingredient"><span className={'inventory-ingredient-avatar '+statusClass(item.status)}><Package size={15}/></span><span><strong>{item.name}</strong><small>Reorder at {item.reorderPoint} {item.unit}</small></span></div></td><td><strong>{item.currentStock.toFixed(1)} {item.unit}</strong><small className="inventory-muted-cell">{item.dailyUsage.toFixed(1)} {item.unit}/day</small></td><td><span className={'inventory-status-pill '+statusClass(item.status)}>{item.status}</span><div className="inventory-stock-track table-stock-track"><span className={statusClass(item.status)} style={{width:stockLevel(item)+'%'}}/></div></td><td><strong>{item.daysLeft.toFixed(1)} days</strong></td><td><strong>₹{Math.round(item.currentStock*item.unitCost).toLocaleString('en-IN')}</strong></td><td><span className={'inventory-order-pill '+(item.orderStatus==='Ordered'?'is-ordered':item.orderStatus==='Received'?'is-received':'')}>{item.orderStatus}</span></td><td><div className="inventory-adjust-controls"><button aria-label={'Reduce '+item.name+' stock by 0.5 '+item.unit} disabled={item.currentStock<0.5} onClick={()=>{dispatch({type:'adjust-stock',itemId:item.id,amount:-0.5});setNotice(item.name+' stock adjusted by −0.5 '+item.unit+'.')}}>−</button><button aria-label={'Increase '+item.name+' stock by 0.5 '+item.unit} onClick={()=>{dispatch({type:'adjust-stock',itemId:item.id,amount:0.5});setNotice(item.name+' stock adjusted by +0.5 '+item.unit+'.')}}>+</button></div></td><td>{item.orderStatus==='Ordered'?<button className="inventory-row-action" onClick={()=>{const amount=Math.max(item.reorderPoint*2-item.currentStock,item.reorderPoint);dispatch({type:'receive-stock',itemId:item.id,amount});setNotice('Received '+amount.toFixed(1)+' '+item.unit+' of '+item.name+' in demo state.')}}>Receive stock</button>:<button className="inventory-row-action" onClick={()=>{dispatch({type:'mark-ordered',itemId:item.id});setNotice(item.name+' marked as ordered in demo state.')}}>{item.orderStatus==='Received'?'Order again':'Mark ordered'}</button>}</td></tr>)}</tbody></table>{rows.length===0&&<div className="inventory-empty">No ingredients match this search and filter.</div>}</div>
   <div className="inventory-table-footer"><Package size={15}/><span>Inventory counts and order actions are demo-only until the backend and supplier workflow are connected.</span></div>
  </section>
 </PageFrame>
}
export function WasteIntelligencePage(){
 const {state,dispatch}=usePlateIQ();
 const [category,setCategory]=useState('All');
 const [query,setQuery]=useState('');
 const [dishId,setDishId]=useState(state.dishes[0]?.id??'');
 const [newCategory,setNewCategory]=useState<'Prepared Food'|'Spoilage'|'Overproduction'|'Other'>('Overproduction');
 const [quantity,setQuantity]=useState('0.5');
 const [cause,setCause]=useState('Overproduction');
 const [notice,setNotice]=useState('');
 const summary=wasteSummary(state.waste);
 const categories=['Prepared Food','Spoilage','Overproduction','Other'] as const;
 const records=state.waste.filter(w=>(category==='All'||w.category===category)&&((state.dishes.find(d=>d.id===w.dishId)?.name??w.dishId).toLowerCase().includes(query.trim().toLowerCase())||w.cause.toLowerCase().includes(query.trim().toLowerCase())));
 const topDishes=Object.entries(summary.byDish).sort((a,b)=>b[1].wasteKg-a[1].wasteKg).slice(0,5);
 const exportCsv=()=>{
  const header=['Dish','Category','Waste kg','Waste cost INR','Date','Cause'];
  const lines=records.map(w=>[state.dishes.find(d=>d.id===w.dishId)?.name??w.dishId,w.category,w.wasteKg,w.wasteCost,w.date,w.cause]);
  const csv=[header,...lines].map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');link.href=url;link.download='plateiq-waste-records.csv';link.click();URL.revokeObjectURL(url);
  setNotice('Exported '+records.length+' filtered waste record'+(records.length===1?'':'s')+' to CSV.');
 };
 const recordWaste=(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  const amount=Number(quantity);
  if(!dishId||!Number.isFinite(amount)||amount<=0||!cause.trim()){setNotice('Choose a dish and enter a valid quantity and cause.');return;}
  dispatch({type:'record-waste',dishId,wasteKg:amount,category:newCategory,cause:cause.trim()});
  setNotice('Waste record added to the local demo state.');
  setQuantity('0.5');
 };
 const formatDate=(value:string)=>{const parsed=new Date(value);return Number.isNaN(parsed.getTime())?value:parsed.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});};
 return <PageFrame title="Waste intelligence" subtitle="Find where food is being lost, record waste consistently, and identify practical ways to reduce it.">
  <div className="waste-demo-banner"><span className="waste-demo-indicator"/> DEMO DATA <span>Records and actions update this browser's shared demo state. No live POS or weighing system is connected.</span></div>
  {notice&&<div className="waste-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></div>}
  <div className="metrics-grid waste-metrics">
   <Kpi label="Total recorded waste" value={summary.wasteKg.toFixed(1)+' kg'} detail={state.waste.length+' recorded events'}/>
   <Kpi label="Estimated waste cost" value={'₹'+Math.round(summary.wasteCost).toLocaleString('en-IN')} detail="using recorded cost estimates"/>
   <Kpi label="Waste reduction" value="—" detail="Needs a comparable historical baseline"/>
   <Kpi label="Potential savings" value="—" detail="Not estimated without a baseline"/>
  </div>
  <div className="waste-overview-grid">
   <section className="panel waste-category-panel">
    <div className="waste-panel-heading"><div><span className="waste-kicker">WHERE IT HAPPENS</span><h2>Waste by category</h2><p>Recorded quantity across all waste events.</p></div><span className="waste-total-chip">{summary.wasteKg.toFixed(1)} kg total</span></div>
    <div className="waste-category-list">{categories.map((name,index)=>{const item=summary.byCategory[name];const pct=summary.wasteKg?Math.min(100,item.wasteKg/summary.wasteKg*100):0;return <div className="waste-category-row" key={name}><div className="waste-category-meta"><span className={'waste-category-mark waste-category-mark-'+index}/><strong>{name}</strong><span>{item.wasteKg.toFixed(1)} kg</span></div><div className="waste-bar-track"><span className={'waste-bar-fill waste-bar-fill-'+index} style={{width:pct+'%'}}/></div><div className="waste-category-foot"><span>{pct.toFixed(0)}% of recorded waste</span><strong>₹{Math.round(item.wasteCost).toLocaleString('en-IN')}</strong></div></div>})}</div>
   </section>
   <section className="panel waste-top-panel">
    <div className="waste-panel-heading"><div><span className="waste-kicker">BIGGEST CONTRIBUTORS</span><h2>Top wasted dishes</h2><p>Prioritise the dishes with the most recorded waste.</p></div></div>
    {topDishes.length?<div className="waste-top-list">{topDishes.map(([id,item],index)=>{const dish=state.dishes.find(d=>d.id===id);const pct=summary.wasteKg?item.wasteKg/summary.wasteKg*100:0;return <div className="waste-top-row" key={id}><span className="waste-rank">{String(index+1).padStart(2,'0')}</span><div className="waste-top-main"><strong>{dish?.name??id}</strong><div className="waste-bar-track"><span className="waste-bar-fill" style={{width:pct+'%'}}/></div></div><div className="waste-top-value"><strong>{item.wasteKg.toFixed(1)} kg</strong><small>₹{Math.round(item.wasteCost).toLocaleString('en-IN')}</small></div></div>})}</div>:<div className="waste-empty"><span>✓</span><strong>No waste records yet</strong><p>Record a waste event to start building this view.</p></div>}
    <div className="waste-baseline-note"><AlertTriangle size={16}/><span>Trend and savings are not shown as a percentage because this demo has no verified comparison baseline.</span></div>
   </section>
  </div>
  <section className="panel waste-record-form-panel">
   <div className="waste-panel-heading"><div><span className="waste-kicker">LOG AN EVENT</span><h2>Record food waste</h2><p>Capture a quantity and cause so the team can spot repeat patterns.</p></div><span className="waste-form-icon">＋</span></div>
   <form className="waste-record-form" onSubmit={recordWaste}>
    <label>Dish<select value={dishId} onChange={e=>setDishId(e.target.value)} required>{state.dishes.map(dish=><option key={dish.id} value={dish.id}>{dish.name}</option>)}</select></label>
    <label>Waste category<select value={newCategory} onChange={e=>{const value=e.target.value as typeof newCategory;setNewCategory(value);setCause(value==='Spoilage'?'Expired or spoiled':value==='Overproduction'?'Overproduction':value==='Prepared Food'?'Plate returns':'Other');}}>{categories.map(option=><option key={option}>{option}</option>)}</select></label>
    <label>Quantity (kg)<input type="number" min="0.1" step="0.1" value={quantity} onChange={e=>setQuantity(e.target.value)} required/></label>
    <label>Cause<input value={cause} onChange={e=>setCause(e.target.value)} placeholder="e.g. overproduction" maxLength={120} required/></label>
    <button className="waste-submit-button" type="submit"><span>＋</span> Record waste</button>
   </form>
   <p className="waste-form-footnote">The cost is an estimate from the demo logic, not an audited food-cost calculation.</p>
  </section>
  <section className="panel data-panel waste-records-panel">
   <div className="waste-panel-heading waste-records-heading"><div><span className="waste-kicker">AUDIT TRAIL</span><h2>Waste records</h2><p>Search and filter the waste events currently stored in this demo.</p></div><button className="waste-export-button" onClick={exportCsv} disabled={records.length===0} title={records.length===0?'No matching records to export':'Export the records matching the current filters'}><span>↓</span> Export CSV</button></div>
   <div className="waste-table-controls"><label className="waste-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search dishes or causes..." aria-label="Search waste records"/></label><label className="waste-category-filter">Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>All</option>{categories.map(option=><option key={option}>{option}</option>)}</select></label></div>
   <div className="table-wrap waste-table-wrap"><table className="waste-table"><thead><tr><th>Dish</th><th>Category</th><th>Quantity</th><th>Est. cost</th><th>Date & time</th><th>Cause</th><th>Quick action</th></tr></thead><tbody>{records.map(w=><tr key={w.id}><td><strong>{state.dishes.find(d=>d.id===w.dishId)?.name||w.dishId}</strong></td><td><span className={'waste-category-pill waste-pill-'+categories.indexOf(w.category)}>{w.category}</span></td><td><strong>{w.wasteKg.toFixed(1)} {w.unit}</strong></td><td>₹{Math.round(w.wasteCost).toLocaleString('en-IN')}</td><td>{formatDate(w.date)}</td><td>{w.cause}</td><td><button className="waste-row-action" onClick={()=>{dispatch({type:'record-waste',dishId:w.dishId,wasteKg:0.5,category:w.category,cause:'Additional event: '+w.cause});setNotice('Added another 0.5 kg waste event for '+(state.dishes.find(d=>d.id===w.dishId)?.name??w.dishId)+'.');}}>＋ 0.5 kg</button></td></tr>)}</tbody></table>{records.length===0&&<div className="waste-empty waste-table-empty"><strong>No matching records</strong><p>Try another search or category filter.</p></div>}</div>
   <div className="waste-table-footer"><span>{records.length} of {state.waste.length} records</span><span>Demo state · local only</span></div>
  </section>
 </PageFrame>
}
export function AnalyticsPage(){
 const {state}=usePlateIQ();
 const metrics=getAnalyticsMetrics(state);
 const [notice,setNotice]=useState('');
 const totalDemand=state.forecasts.reduce((sum,item)=>sum+item.forecast,0);
 const totalActual=state.forecasts.reduce((sum,item)=>sum+item.actual,0);
 const totalPrepared=state.dishes.reduce((sum,item)=>sum+item.prepared,0);
 const totalWaste=state.waste.reduce((sum,item)=>sum+item.wasteKg,0);
 const wasteCost=state.waste.reduce((sum,item)=>sum+item.wasteCost,0);
 const lowStock=state.inventory.filter(item=>item.status==='Low'||item.status==='Critical');
 const completedBatches=state.batches.filter(item=>item.status==='Completed').length;
 const maxDishValue=Math.max(1,...state.forecasts.flatMap(item=>[item.forecast,item.actual]));
 const dishRows=state.forecasts.map(item=>({ ...item, name:state.dishes.find(dish=>dish.id===item.dishId)?.name??item.dishId, variance:item.actual-item.forecast }));
 const exportCsv=()=>{
  const header=['Dish','Forecast','Actual orders','Variance','Prepared','Confidence (%)','Recommended preparation'];
  const rows=dishRows.map(item=>[item.name,item.forecast,item.actual,item.variance,state.dishes.find(dish=>dish.id===item.dishId)?.prepared??0,item.confidence,item.recommendedPreparation]);
  const csv=[header,...rows].map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\\r\\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');link.href=url;link.download='plateiq-insights.csv';link.click();URL.revokeObjectURL(url);
  setNotice('Insights report exported as CSV.');
 };
 const insightCards=[
  {type:lowStock.some(item=>item.status==='Critical')?'urgent':'watch',title:lowStock.some(item=>item.status==='Critical')?'Critical stock needs attention':lowStock.length?'Review low-stock ingredients':'Inventory coverage looks stable',body:lowStock.length?lowStock.slice(0,3).map(item=>item.name+' ('+item.daysLeft.toFixed(1)+' days)').join(', '):'No low or critical stock items are currently flagged.',href:'/app/inventory',action:'Review inventory'},
  {type:totalPrepared>totalDemand?'watch':'positive',title:totalPrepared>totalDemand?'Preparation is above forecast':'Preparation is tracking forecast',body:'Prepared '+totalPrepared+' portions against '+totalDemand+' forecast portions.',href:'/app/kitchen-planner',action:'Review prep plan'},
  {type:totalWaste>0?'watch':'positive',title:totalWaste>0?'Recorded waste has a cost signal':'Start tracking waste events',body:totalWaste>0?totalWaste.toFixed(1)+' kg recorded · estimated cost ₹'+Math.round(wasteCost).toLocaleString('en-IN'):'Add waste records to surface category and dish-level patterns.',href:'/app/waste-intelligence',action:'Explore waste'},
 ];
 return <PageFrame title="Insights" subtitle="Turn forecast, preparation, inventory, and waste signals into clearer day-to-day decisions.">
  <div className="insights-demo-banner"><span className="insights-demo-dot"/> DEMO INSIGHTS <span>Calculated from PlateIQ's current local demo state; historical trends and external data are not connected.</span></div>
  {notice&&<div className="insights-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></div>}
  <section className="insights-hero">
   <div><span className="insights-eyebrow">OPERATIONAL PERFORMANCE</span><h2>Your kitchen, at a glance</h2><p>Live calculations from the current demo forecast and recorded operations.</p></div>
   <button className="insights-export-button" onClick={exportCsv}><span>↓</span> Export report</button>
  </section>
  <div className="metrics-grid insights-metrics">
   <Kpi label="Forecast confidence" value={metrics.forecastAccuracy.toFixed(1)+'%'} detail="Average confidence across forecasts"/>
   <Kpi label="Demand forecast" value={totalDemand.toLocaleString('en-IN')} detail="Forecast portions across dishes"/>
   <Kpi label="Prep efficiency" value={metrics.preparationEfficiency.toFixed(1)+'%'} detail="Prepared quantity vs forecast"/>
   <Kpi label="Recorded waste" value={totalWaste.toFixed(1)+' kg'} detail="Across '+state.waste.length+' recorded events".replace('Across ','Across ' )}/>
   <Kpi label="Stock risk" value={lowStock.length.toString()} detail="Low or critical ingredients"/>
  </div>
  <div className="insights-main-grid">
   <section className="panel insights-performance-panel">
    <div className="insights-section-heading"><div><span className="insights-kicker">DEMAND PERFORMANCE</span><h2>Forecast vs actual orders</h2><p>Compare forecast portions with the actual-order values currently stored for each dish.</p></div><span className="insights-chart-legend"><i className="insights-legend-forecast"/> Forecast <i className="insights-legend-actual"/> Actual</span></div>
    <div className="insights-dish-chart">{dishRows.map(item=><div className="insights-dish-row" key={item.id}><div className="insights-dish-meta"><strong>{item.name}</strong><span>{item.actual>=item.forecast?'+'+(item.actual-item.forecast):(item.actual-item.forecast).toString()} portions vs forecast</span></div><div className="insights-dual-bars"><div className="insights-bar-line"><span className="insights-bar-label">Forecast</span><div className="insights-bar-track"><span className="insights-bar-forecast" style={{width:Math.max(2,item.forecast/maxDishValue*100)+'%'}}/></div><strong>{item.forecast}</strong></div><div className="insights-bar-line"><span className="insights-bar-label">Actual</span><div className="insights-bar-track"><span className="insights-bar-actual" style={{width:Math.max(2,item.actual/maxDishValue*100)+'%'}}/></div><strong>{item.actual}</strong></div></div></div>)}
    {dishRows.length===0&&<div className="insights-empty">Forecast data will appear here when dishes are available.</div>}
    </div>
    <div className="insights-panel-footer"><span>Forecast total <strong>{totalDemand.toLocaleString('en-IN')}</strong></span><span>Actual orders <strong>{totalActual.toLocaleString('en-IN')}</strong></span><span>Variance <strong>{totalActual-totalDemand>0?'+':''}{(totalActual-totalDemand).toLocaleString('en-IN')}</strong></span></div>
   </section>
   <section className="panel insights-readiness-panel">
    <div className="insights-section-heading"><div><span className="insights-kicker">SERVICE READINESS</span><h2>Operational pulse</h2><p>Current status from the shared demo data.</p></div></div>
    <div className="insights-readiness-score"><div className="insights-readiness-ring" style={{'--insights-score':Math.max(0,Math.min(100,metrics.preparationEfficiency))+'%'} as React.CSSProperties}><strong>{Math.round(metrics.preparationEfficiency)}<small>%</small></strong></div><div><strong>Preparation efficiency</strong><p>{totalPrepared} portions prepared against {totalDemand} forecast.</p></div></div>
    <div className="insights-readiness-list"><div><span><i className="insights-status-dot is-good"/>Inventory risk</span><strong>{lowStock.length===0?'No flagged items':lowStock.length+' items to review'}</strong></div><div><span><i className="insights-status-dot '+(completedBatches>0?'is-good':'is-neutral')+'"/>Completed batches</span><strong>{completedBatches}</strong></div><div><span><i className="insights-status-dot '+(state.waste.length>0?'is-watch':'is-neutral')+'"/>Waste records</span><strong>{state.waste.length}</strong></div><div><span><i className="insights-status-dot '+(state.events.length>0?'is-good':'is-neutral')+'"/>Operational events</span><strong>{state.events.length}</strong></div></div>
   </section>
  </div>
  <section className="insights-insight-section"><div className="insights-section-heading"><div><span className="insights-kicker">SUGGESTED NEXT STEPS</span><h2>Signals worth a look</h2><p>Practical prompts generated from current demo values, not a trained AI model.</p></div><span className="insights-count-pill">{insightCards.length} signals</span></div>
   <div className="insights-cards-grid">{insightCards.map((item,index)=><article className="panel insights-signal-card" key={item.title}><div className={'insights-signal-icon '+(item.type==='urgent'?'is-urgent':item.type==='watch'?'is-watch':'is-positive')}>{index===0?'!':index===1?'↗':'◌'}</div><span className={'insights-signal-tag '+(item.type==='urgent'?'is-urgent':item.type==='watch'?'is-watch':'is-positive')}>{item.type==='urgent'?'Priority':item.type==='watch'?'Review':'On track'}</span><h3>{item.title}</h3><p>{item.body}</p><Link href={item.href}>{item.action} <ArrowRight size={14}/></Link></article>)}</div>
  </section>
  <section className="panel insights-waste-summary"><div><span className="insights-kicker">WASTE & COST SIGNAL</span><h2>What is recorded so far</h2><p>Cost figures are estimates based on demo waste records, not audited savings or a historical reduction.</p></div><div className="insights-waste-stats"><div><span>Waste recorded</span><strong>{totalWaste.toFixed(1)} kg</strong></div><div><span>Estimated waste cost</span><strong>₹{Math.round(wasteCost).toLocaleString('en-IN')}</strong></div><div><span>Waste baseline</span><strong>{metrics.wasteReductionPct===null?'Not available':metrics.wasteReductionPct.toFixed(1)+'%'}</strong></div><Link href="/app/waste-intelligence">Open waste management <ArrowRight size={14}/></Link></div></section>
  <div className="insights-footnote"><Sparkles size={15}/><span>Insights update when the local demo state changes. Reliable time-series trends, verified savings, and real restaurant integrations require historical records and backend data.</span></div>
 </PageFrame>
}
