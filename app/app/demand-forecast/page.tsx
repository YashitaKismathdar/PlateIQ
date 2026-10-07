'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, Bot, Download, LineChart, Sparkles, TrendingUp, Utensils, Zap } from 'lucide-react'

const nav = [
  ['Overview','/app'],['Live Operations','/app/live-operations'],['Tasks','/app/kitchen-planner'],['Forecasting','/app/demand-forecast'],
  ['Inventory','/app/inventory'],['Waste Management','/app/waste-intelligence'],['External Factors','/app/external-factors'],
  ['AI Copilot','/app/copilot'],['Insights','/app/analytics'],['Settings','/app/settings'],
]

const covers = [148,198,242,162,135,228,250]
const days = ['Thu 24','Fri 25','Sat 26','Sun 27','Wed 30','Fri Nov 1','Sat Nov 2']
const menu = [
  ['Seared Maine Halibut','Sauté','184','$48','24.2%','$36.38','Low (-0.22)','+$3'],
  ['A5 Miyazaki Wagyu','Hearth','142','$95','32.5%','$64.12','Inelastic (-0.11)','Swap garnish'],
  ['Dry-Aged Duck Breast','Hearth / Sauté','88','$44','34.8%','$28.68','Med (-0.68)','Pre-Theater +25%'],
  ['Black Truffle & Morels Risotto','Sauté','165','$34','18.5%','$27.71','Low (-0.18)','Par +12%'],
  ['Crispy Iberico Pork Belly','Garde Manger','42','$26','38.4%','$16.01','High (-1.15)','Sub: Venison'],
]

export default function DemandForecastPage() {
  const [range,setRange] = useState('Next 7 Days')
  const [price,setPrice] = useState(185)
  const suggested = 200
  return <div style={{minHeight:'100vh',background:'#effdf0',color:'#00341e',fontFamily:'Inter,system-ui,sans-serif'}}>
    <aside style={{position:'fixed',inset:'0 auto 0 0',width:288,background:'#00341e',color:'#effdf0',padding:'24px 18px',zIndex:20}}>
      <div style={{fontWeight:800,fontSize:22,letterSpacing:'-.03em',padding:'8px 12px 28px'}}>PlateIQ <span style={{color:'#acf847'}}>AI</span></div>
      <div style={{fontSize:11,opacity:.6,padding:'0 12px 12px',letterSpacing:'.12em'}}>RESTAURANT INTELLIGENCE</div>
      {nav.map(([label,href])=><Link key={href} href={href} style={{display:'block',padding:'11px 12px',margin:'3px 0',borderRadius:10,textDecoration:'none',color:label==='Forecasting'?'#00341e':'#effdf0',background:label==='Forecasting'?'#acf847':'transparent',fontSize:14,fontWeight:label==='Forecasting'?750:500}}>{label}</Link>)}
    </aside>
    <header style={{position:'fixed',top:0,left:288,right:0,height:64,background:'#fff',borderBottom:'1px solid #d5e8d6',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',zIndex:10}}>
      <div><strong>PlateIQ AI Kitchen OS</strong><span style={{marginLeft:18,fontSize:13,opacity:.65}}>Dinner Service</span></div>
      <div style={{fontSize:13,fontWeight:650}}><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#70d99b',marginRight:8}}/>Live Sync</div>
    </header>
    <main style={{marginLeft:288,padding:'100px 36px 56px',maxWidth:1600}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:24,alignItems:'end',marginBottom:28}}>
        <div><div style={{fontSize:12,fontWeight:800,letterSpacing:'.12em',opacity:.58}}>PREDICTIVE REVENUE & MENU INTELLIGENCE ENGINE</div><h1 style={{fontSize:36,margin:'8px 0 6px',letterSpacing:'-.04em'}}>AI Copilot Forecasting & Menu Optimization</h1><p style={{margin:0,opacity:.7}}>Multi-Variate Cover Prediction • Margin Matrix Engineering • Real-Time Weather & Local Event Uplift • Menu Price Elasticity Simulator</p></div>
        <div style={{display:'flex',gap:10}}><button style={buttonStyle}><Download size={15}/> Export Model</button><button style={{...buttonStyle,background:'#00341e',color:'#effdf0'}}><Sparkles size={15}/> Apply AI Rebalancing</button></div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:22}}>{['Next 7 Days','14-Day Outlook','Weekend Deep-Dive','30-Day Seasonal'].map(x=><button key={x} onClick={()=>setRange(x)} style={{...tabStyle,background:range===x?'#00341e':'#fff',color:range===x?'#effdf0':'#00341e'}}>{x}</button>)}</div>
      <section style={grid4}>
        <Card title="Forecasted Covers & Revenue" value="2,480 covers" detail="$218,450 · +14.8% vs 4wk"/>
        <Card title="Theoretical Contribution Margin" value="73.2%" detail="Target > 71.0% · +2.4% with AI"/>
        <Card title="Food Cost Ratio" value="26.8%" detail="COGS: $58,545 · Within target"/>
        <Card title="External Uplift Multiplier" value="97.1% Conf." detail="+284 (+11.4%) · Weather + events"/>
      </section>
      <section style={panel}>
        <div style={sectionHead}><div><small>PREDICTIVE COVER CURVE</small><h2>Expected covers by service date</h2></div><span style={pill}>MAX DINING CAP 225</span></div>
        <div style={{height:220,display:'flex',alignItems:'end',gap:18,padding:'20px 10px 8px',borderBottom:'1px solid #d5e8d6'}}>
          {covers.map((v,i)=><div key={v} style={{flex:1,height:'100%',display:'flex',flexDirection:'column',justifyContent:'end',alignItems:'center',gap:8}}><div style={{fontWeight:800,fontSize:12}}>{v}</div><div style={{width:'72%',height:(v/250)*160,background:i===2||i===6?'#acf847':'#006d40',borderRadius:'7px 7px 2px 2px'}}/><small>{days[i]}</small></div>)}
        </div>
        <div style={{paddingTop:14,fontSize:13,fontWeight:700}}>Peak Bottleneck <span style={{fontWeight:500,opacity:.65}}>19:30–21:15 · Main Hearth</span></div>
      </section>
      <section style={grid2}>
        <Card title="Profitability Optimization Index" value="+$14,820" detail="3 high-impact triggers · 2 Price Tweaks / 1 Plowhorse Shift / 1 Par Boost"><button style={linkButton}>Review Optimization Playbook →</button></Card>
        <Card title="Price Elasticity Simulator" value={'$'+price} detail={'Suggested $'+suggested+' · Projected demand impact -2.1% · Net revenue delta +$1,140/week · Confidence 94.2%'}><input aria-label="Base price" type="range" min="150" max="220" value={price} onChange={e=>setPrice(Number(e.target.value))} style={{width:'100%',accentColor:'#006d40'}}/></Card>
      </section>
      <section style={panel}>
        <div style={sectionHead}><div><small>MENU ENGINEERING MATRIX</small><h2>Margin × demand optimization</h2></div><BarChart3 size={20}/></div>
        <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['Dish','Station','Orders','Price','Food Cost','Contribution','Elasticity','AI Action'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{menu.map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i} style={td}>{c}</td>)}</tr>)}</tbody></table></div>
      </section>
      <section style={grid3}>
        <Trigger icon={<Zap size={17}/>} title="Dynamic Weather Menu Adaptor" text="Cold rain Friday–Sunday; elevate Braised Short Ribs & Risotto."/>
        <Trigger icon={<TrendingUp size={17}/>} title="Pre-Theater Surge Pacing" text="Symphony Gala detected; speed menu caps table turn at 58 minutes."/>
        <Trigger icon={<Utensils size={17}/>} title="Supplier Price Volatility Hedge" text="Halibut spot price +6.5%; maintain 24% food-cost target."/>
      </section>
      <section style={{...panel,background:'#00341e',color:'#effdf0'}}>
        <div style={sectionHead}><div><small style={{opacity:.65}}>AI COPILOT</small><h2 style={{marginBottom:4}}>Forecast confidence & operational guidance</h2></div><Bot size={22}/></div>
        <p style={{opacity:.78,maxWidth:800}}>The model recommends protecting high-confidence demand while shifting preparation toward dishes with favorable margin and event-driven uplift. Rebalance prep before the 17:30 cut-off and monitor the Main Hearth bottleneck through peak service.</p>
        <div style={{display:'flex',gap:12,marginTop:18}}><span style={darkPill}>94.2% model confidence</span><span style={darkPill}>+11.4% external uplift</span><span style={darkPill}>3 actions recommended</span></div>
      </section>
    </main>
  </div>
}

function Card({title,value,detail,children}:{title:string,value:string,detail:string,children?:React.ReactNode}){return <div style={{background:'#fff',border:'1px solid #d5e8d6',borderRadius:16,padding:20,boxShadow:'0 8px 24px rgba(0,52,30,.05)'}}><div style={{fontSize:12,fontWeight:800,opacity:.58,letterSpacing:'.06em'}}>{title}</div><div style={{fontSize:28,fontWeight:850,margin:'9px 0 4px',letterSpacing:'-.03em'}}>{value}</div><div style={{fontSize:13,opacity:.68,lineHeight:1.5}}>{detail}</div>{children}</div>}
function Trigger({icon,title,text}:{icon:React.ReactNode,title:string,text:string}){return <div style={{background:'#fff',border:'1px solid #d5e8d6',borderRadius:16,padding:18}}><div style={{display:'flex',gap:10,alignItems:'center',fontWeight:800}}>{icon}<span>{title}</span></div><p style={{fontSize:13,opacity:.7,lineHeight:1.5}}>{text}</p></div>}
const panel={background:'#fff',border:'1px solid #d5e8d6',borderRadius:18,padding:22,marginBottom:20}
const grid4={display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14,marginBottom:20}
const grid3={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14,marginBottom:20}
const grid2={display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:14,marginBottom:20}
const sectionHead={display:'flex',justifyContent:'space-between',alignItems:'start',gap:20}
const th={textAlign:'left' as const,padding:'12px 10px',borderBottom:'1px solid #d5e8d6',fontSize:11,opacity:.6,textTransform:'uppercase' as const,letterSpacing:'.06em'}
const td={padding:'14px 10px',borderBottom:'1px solid #edf4ed'}
const pill={background:'#e8f8e8',padding:'7px 10px',borderRadius:99,fontSize:11,fontWeight:800}
const darkPill={background:'#174b32',padding:'8px 11px',borderRadius:99,fontSize:12}
const buttonStyle={display:'flex',alignItems:'center',gap:7,border:'1px solid #c8ddca',background:'#fff',color:'#00341e',padding:'10px 13px',borderRadius:10,fontWeight:750,cursor:'pointer'}
const tabStyle={border:'1px solid #c8ddca',padding:'9px 13px',borderRadius:9,fontWeight:700,cursor:'pointer'}
const linkButton={marginTop:14,border:0,background:'transparent',padding:0,color:'#006d40',fontWeight:800,cursor:'pointer'}
