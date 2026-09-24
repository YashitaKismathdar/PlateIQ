export type DishStatus = 'On Track' | 'Preparing' | 'Batch Recommended' | 'Surge' | 'Completed'
export type BatchStatus = 'Recommended' | 'In Preparation' | 'Ready' | 'Completed'
export type Severity = 'info' | 'warning' | 'critical'
export type Weather = 'Clear' | 'Cloudy' | 'Rain' | 'Heavy Rain'
export type ScenarioLevel = 'None' | 'Low' | 'Medium' | 'High'
export type InventoryOrderStatus = 'Not Ordered' | 'Ordered' | 'Received'
export type WasteCategory = 'Prepared Food' | 'Spoilage' | 'Overproduction' | 'Other'
export interface Restaurant { id:string; name:string; city:string; country:string; timezone:string; currency:string }
export interface Dish { id:string; name:string; category:string; forecast:number; lowerBound:number; upperBound:number; confidence:number; actualOrders:number; prepared:number; initialBatch:number; nextBatch:number; batchSize:number; leadTimeMinutes:number; status:DishStatus; ingredients:Record<string,number> }
export interface Forecast { id:string; dishId:string; period:string; baseline:number; forecast:number; lowerBound:number; upperBound:number; confidence:number; actual:number; projectedDemand:number; recommendedPreparation:number }
export interface PreparationBatch { id:string; dishId:string; number:number; quantity:number; status:BatchStatus; createdAt:string; updatedAt:string }
export interface KitchenStation { id:string; name:string; capacity:number; status:'Ready'|'Busy'|'At Risk' }
export interface InventoryItem { id:string; name:string; unit:string; currentStock:number; reorderPoint:number; dailyUsage:number; unitCost:number; status:'Healthy'|'Low'|'Critical'; daysLeft:number; trend:'Rising'|'Stable'|'Falling'; orderStatus:InventoryOrderStatus }
export interface WasteRecord { id:string; dishId:string; prepared:number; consumed:number; spoilageKg:number; overproductionKg:number; wasteKg:number; wasteCost:number; unit:'kg'; category:WasteCategory; cause:string; date:string }
export interface Alert { id:string; title:string; description:string; severity:Severity; dismissed:boolean; relatedEntity?:string }
export interface Notification { id:string; title:string; description:string; href:string; read:boolean; createdAt:string }
export interface OperationalEvent { id:string; timestamp:string; type:string; title:string; description:string; severity:Severity; relatedEntity?:string }
export interface AIRecommendation { id:string; title:string; description:string; actionLabel?:string; confidence:number; dishId?:string }
export interface SimulationScenario { customerChange:number; weather:Weather; holiday:ScenarioLevel; localEvent:ScenarioLevel; promotion:boolean }
export interface DemoState { running:boolean; step:number; speed:1|2|4; orders:number; ordersPerMinute:number; baselineVelocity:number; projectedDemand:number; prepared:number; kitchenCapacity:number; forecast:number; lowerBound:number; upperBound:number; confidence:number; status:'Monitoring'|'Adjusting'|'Surge'; batch:PreparationBatch; showReason:boolean; dismissedAlertIds:string[]; scenario:SimulationScenario; simulatedTime:string }
export interface DailyMetrics { demand:number; prepared:number; wasteKg:number; wasteCost:number; forecastAccuracy:number; savings:number }
export interface PlateIQState { version:number; restaurant:Restaurant; dishes:Dish[]; forecasts:Forecast[]; batches:PreparationBatch[]; stations:KitchenStation[]; inventory:InventoryItem[]; waste:WasteRecord[]; alerts:Alert[]; notifications:Notification[]; recommendations:AIRecommendation[]; events:OperationalEvent[]; scenario:SimulationScenario; demo:DemoState; metrics:DailyMetrics }
export type PlateIQAction = {type:'toggle'}|{type:'tick'}|{type:'reset'}|{type:'reset-scenario'}|{type:'speed';value:1|2|4}|{type:'batch';batchId?:string}|{type:'batch-status';batchId:string;status:BatchStatus}|{type:'reason';value:boolean}|{type:'dismiss-alert';alertId:string}|{type:'scenario';scenario:Partial<SimulationScenario>}|{type:'apply-plan'}|{type:'read-notifications'}|{type:'reset-data'}|{type:'hydrate';state:PlateIQState}|{type:'receive-stock';itemId:string;amount:number}|{type:'mark-ordered';itemId:string}|{type:'adjust-stock';itemId:string;amount:number}|{type:'record-waste';dishId:string;wasteKg:number;category:WasteCategory;cause:string}|{type:'read-notification';notificationId:string}|{type:'dismiss-alert';alertId:string}
export const demoOrders = [10,20,35,48,62,78,91,105,120] as const
