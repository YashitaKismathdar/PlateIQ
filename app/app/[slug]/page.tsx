import type React from 'react'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { ProductPage } from '@/components/product-pages'
import { LiveOperationsPage, KitchenPlannerPage, DemandForecastPage, InventoryPage, WasteIntelligencePage, AnalyticsPage } from '@/components/operational-pages'
export default async function ProductRoute({params}:{params:Promise<{slug:string}>}){const {slug}=await params; const pages:Record<string,React.ReactNode>={ 'live-operations':<LiveOperationsPage/>, 'kitchen-planner':<KitchenPlannerPage/>, 'demand-forecast':<DemandForecastPage/>, inventory:<InventoryPage/>, 'waste-intelligence':<WasteIntelligencePage/>, 'what-if':<ProductPage kind="what-if"/>, analytics:<AnalyticsPage/>, copilot:<ProductPage kind="copilot"/> }; if (!(slug in pages)) notFound(); return <AppShell>{pages[slug]}</AppShell>}
