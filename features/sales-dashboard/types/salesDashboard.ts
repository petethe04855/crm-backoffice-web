/** Response contract of GET /api/v1/crm/sales-dashboard (backoffice-api). */

export interface SalesRange {
  from: string;
  to: string;
  days: number;
}

/** One KPI block. Change fields are null when the previous value is 0. */
export interface SalesSummary {
  sales: number;
  orders: number;
  buyers: number;
  items: number;
  aov: number;
  salesChangePercent: number | null;
  ordersChangePercent: number | null;
  buyersChangePercent: number | null;
  aovChangePercent: number | null;
}

export interface SalesChannelPoint {
  channel: string;
  label: string;
  orders: number;
  sales: number;
  sharePercent: number;
}

export interface SalesTrendPoint {
  period: string;
  startDate: string;
  endDate: string;
  shopeeSales: number;
  tiktokSales: number;
  totalSales: number;
  shopeeOrders: number;
  tiktokOrders: number;
  totalOrders: number;
}

export interface SalesTrend {
  weekly: SalesTrendPoint[];
  monthly: SalesTrendPoint[];
}

export interface SalesMonth {
  month: string;
  units: number;
  orders: number;
  sales: number;
  sharePercent: number;
}

export interface SalesFlavor {
  key: string;
  label: string;
  units: number;
  orders: number;
  sales: number;
  sharePercent: number;
  changePercent: number | null;
  months: SalesMonth[];
}

export interface SalesProduct {
  sku: string;
  name: string;
  units: number;
  orders: number;
  sales: number;
  sharePercent: number;
}

export interface SalesSet {
  name: string;
  orders: number;
  sharePercent: number;
}

export interface SalesAccessory {
  key: string;
  label: string;
  units: number;
  sharePercent: number;
}

export interface SalesProvince {
  province: string;
  region: string;
  buyers: number;
  orders: number;
  sales: number;
  aov: number;
  sharePercent: number;
}

export interface SalesRegion {
  region: string;
  provinceCount: number;
  orders: number;
  sales: number;
  sharePercent: number;
}

export interface SalesCustomer {
  platform: string;
  buyer: string;
  orders: number;
  sales: number;
  aov: number;
  items: number;
  firstOrder: string;
  lastOrder: string;
  province: string;
  frequencyBucket: string;
}

export interface SalesFrequency {
  label: string;
  buyers: number;
  sharePercent: number;
}

export interface SalesHour {
  hour: number;
  orders: number;
  sales: number;
}

export interface SalesWeekday {
  day: number;
  label: string;
  orders: number;
  sales: number;
}

export interface SalesDayOfMonth {
  day: number;
  orders: number;
  sales: number;
}

export interface SalesTiming {
  hours: SalesHour[];
  weekdays: SalesWeekday[];
  daysOfMonth: SalesDayOfMonth[];
  peakHour: number;
  peakWeekday: string;
  peakDay: number;
}

export interface SalesRepurchaseBucket {
  label: string;
  minDays: number;
  maxDays: number;
  buyers: number;
  sharePercent: number;
}

export interface SalesRepurchase {
  buckets: SalesRepurchaseBucket[];
  repeatBuyers: number;
  repeatRatePercent: number;
  averageGapDays: number;
}

/** Whole dashboard payload for one filter set. */
export interface SalesReport {
  range: SalesRange;
  channel: string;
  region: string;
  masked: boolean;
  summary: SalesSummary;
  previous: SalesSummary;
  channels: SalesChannelPoint[];
  trend: SalesTrend;
  flavors: SalesFlavor[];
  products: SalesProduct[];
  sets: SalesSet[];
  accessories: SalesAccessory[];
  provinces: SalesProvince[];
  regions: SalesRegion[];
  customers: SalesCustomer[];
  frequencies: SalesFrequency[];
  timing: SalesTiming;
  repurchase: SalesRepurchase;
}

export interface SalesCustomerOrder {
  platform: string;
  orderNo: string;
  date: string;
  amount: number;
  channel: string;
  province: string;
  items: number;
}

export interface SalesCustomerDetail {
  customer: SalesCustomer;
  orders: SalesCustomerOrder[];
}

/** Query of one dashboard request. Dates are inclusive Bangkok days. */
export interface SalesFilters {
  dateFrom: string;
  dateTo: string;
  channel: string;
  region: string;
}

/** GET /reports/members — CRM members (dashboard part B). */
export interface MemberReport {
  dateFrom: string;
  dateTo: string;
  totalMembers: number;
  newMembers: number;
  activeMembers: number;
  pointsEarned: number;
  pointsRedeemed: number;
  pointsExpired: number;
  pointsAdjusted: number;
  pointsRefunded: number;
  outstandingPoints: number;
  months: { month: string; newMembers: number; pointsEarned: number; pointsRedeemed: number; pointsExpired: number }[];
}
