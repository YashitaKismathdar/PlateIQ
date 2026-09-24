import { demoOrders, type DemoState } from './types'
export function getDemoOrders(step:number){return demoOrders[Math.min(demoOrders.length-1,Math.max(0,step))]}
export function isDemandSurge(ordersPerMinute:number,baselineVelocity:number){return ordersPerMinute>baselineVelocity*1.45}
export function getDemoMetrics(step:number,baselineVelocity=8){const orders=getDemoOrders(step);const ordersPerMinute=Number((orders/6).toFixed(1));const kitchenCapacity=Math.min(98,Math.round(72+step*2.4));const status=(isDemandSurge(ordersPerMinute,baselineVelocity)?'Surge':ordersPerMinute>baselineVelocity*1.15?'Adjusting':'Monitoring') as DemoState['status'];return {orders,ordersPerMinute,kitchenCapacity,status}}
