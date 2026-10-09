import type React from 'react'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { ProductPage, ForecastingPage } from '@/components/product-pages'
import { InventoryPage, WasteIntelligencePage, AnalyticsPage } from '@/components/operational-pages'
export default async function ProductRoute({params}:{params:Promise<{slug:string}>}){const {slug}=await params; const pages:Record<string,React.ReactNode>={ inventory:<InventoryPage/>, 'waste-intelligence':<WasteIntelligencePage/>, 'what-if':<ProductPage kind="what-if"/>, analytics:<AnalyticsPage/>, copilot:<ProductPage kind="copilot"/> }; if (!(slug in pages)) notFound(); return <AppShell>{slug === 'demand-forecast' ? <ForecastingPage /> : pages[slug]}</AppShell>}
