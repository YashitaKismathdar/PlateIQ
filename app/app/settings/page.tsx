'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { usePlateIQ } from '@/components/plateiq-state'
export default function SettingsPage(){const {dispatch}=usePlateIQ();return <AppShell><div className="page-body"><div className="page-heading"><div><div className="eyebrow">WORKSPACE SETTINGS</div><h1>Settings</h1><p>Configure the PlateIQ restaurant workspace.</p></div></div><div className="settings-grid"><section className="panel settings-card"><h2>Restaurant</h2><p>Jubilee Hills Restaurant · Hyderabad, India</p><h2>Service hours</h2><p>Lunch service · 11:00 AM – 3:00 PM</p><h2>Currency</h2><p>Indian Rupee (₹)</p></section><section className="panel settings-card"><h2>Workspace preferences</h2><label className="setting-row"><span>Notifications</span><input type="checkbox" defaultChecked/></label><label className="setting-row"><span>Operational notifications</span><input type="checkbox" defaultChecked/></label><button className="outline-button" onClick={()=>dispatch({type:'reset-data'})}>Reset application data</button></section></div></div></AppShell>}
