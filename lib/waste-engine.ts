import type { WasteCategory, WasteRecord } from './types'

export interface WasteSummary {
	wasteKg: number
	wasteCost: number
	wasteTrend: 'Unavailable' | 'Increasing' | 'Decreasing' | 'Stable'
	wasteReductionPct: number | null
	potentialSavings: number | null
	byCategory: Record<WasteCategory, { wasteKg: number; wasteCost: number }>
	byDish: Record<string, { wasteKg: number; wasteCost: number }>
}

export function wasteCategory(record: WasteRecord): WasteCategory {
	return record.category
}

export function wasteSummary(records: WasteRecord[]): WasteSummary {
	const summary: WasteSummary = {
		wasteKg: 0,
		wasteCost: 0,
		wasteTrend: 'Unavailable',
		wasteReductionPct: null,
		potentialSavings: null,
		byCategory: {
			Overproduction: { wasteKg: 0, wasteCost: 0 },
			'Prepared Food': { wasteKg: 0, wasteCost: 0 },
			Spoilage: { wasteKg: 0, wasteCost: 0 },
			Other: { wasteKg: 0, wasteCost: 0 },
		},
		byDish: {},
	}

	for (const record of records) {
		summary.wasteKg = Number((summary.wasteKg + record.wasteKg).toFixed(1))
		summary.wasteCost += record.wasteCost
		const category = summary.byCategory[wasteCategory(record)]
		category.wasteKg = Number((category.wasteKg + record.wasteKg).toFixed(1))
		category.wasteCost += record.wasteCost
		const dish = summary.byDish[record.dishId] ?? { wasteKg: 0, wasteCost: 0 }
		summary.byDish[record.dishId] = {
			wasteKg: Number((dish.wasteKg + record.wasteKg).toFixed(1)),
			wasteCost: dish.wasteCost + record.wasteCost,
		}
	}

	return summary
}
