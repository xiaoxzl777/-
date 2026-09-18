/** 接口数据类型，字段说明见 docs/接口文档.md */

export type Mood = 'PROUD' | 'ANNOYED' | 'CARING' | 'THINKING';
export type Pace = 'RELAXED' | 'NORMAL' | 'TIGHT';
export type PoiType = 'SCENIC' | 'RESTAURANT';
export type TravelMode = 'WALK' | 'METRO' | 'TAXI';
export type PoiStatus = 'ONLINE' | 'OFFLINE';

export interface PageResult<T> {
  list: T[];
  total: number;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface District {
  id: number;
  name: string;
  sort: number;
}

export interface OpenRule {
  weekdays: number[];
  openTime: string;
  closeTime: string;
  lastEntryTime: string | null;
}

export interface ClosedDate {
  id: number;
  date: string;
  reason: string | null;
}

export interface Poi {
  id: number;
  type: PoiType;
  name: string;
  districtId: number;
  districtName: string | null;
  illustration: string;
  stayMinutes: number;
  fullDay: boolean;
  ticketPrice: number | null;
  avgCost: number | null;
  rating: number | null;
  tags: string[];
  officialUrl: string | null;
  status: PoiStatus;
}

export interface PoiDetail extends Poi {
  adminArea: string | null;
  address: string | null;
  lng: number;
  lat: number;
  intro: string | null;
  openRules: OpenRule[];
  closedDates: ClosedDate[];
}

export interface PoiQuery {
  districtId?: number;
  type?: PoiType;
  keyword?: string;
  status?: PoiStatus;
  page?: number;
  size?: number;
}

export interface Conditions {
  date: string;
  startTime: string;
  adults: number;
  seniors: number;
  children: number;
  budget: number | null;
  pace: Pace;
  districtIds: number[];
  mustPoiIds: number[];
  avoidPoiIds: number[];
  interests: string[];
}

export interface PlanItem {
  seq: number;
  poiId: number;
  name: string;
  type: PoiType;
  illustration: string;
  lng: number;
  lat: number;
  officialUrl: string | null;
  startTime: string;
  endTime: string;
  cost: number;
  nextMode: TravelMode | null;
  nextMinutes: number | null;
  nextMeters: number | null;
  nextCost: number | null;
}

export interface Step {
  title: string;
  detail: string;
}

export interface Plan {
  conditions: Conditions;
  items: PlanItem[];
  totalCost: number;
  steps: Step[];
  warnings: string[];
}

export interface ChatReply {
  /** BLOCKED：命中敏感内容，没有发给大模型，小萧用写好的话回复 */
  intent: 'PLAN' | 'CHAT' | 'BLOCKED';
  mood: Exclude<Mood, 'THINKING'>;
  reply: string;
  plan: Plan | null;
}

export interface Greeting {
  mood: Exclude<Mood, 'THINKING'>;
  reply: string;
}

/** 小萧能不能用（后台顶部提醒） */
export interface AiStatus {
  available: boolean;
  /** 不能用的原因，比如“DeepSeek 余额不足，请充值” */
  problem: string | null;
  /** DeepSeek 余额（元） */
  balance: string | null;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface TripSummary {
  id: number;
  title: string;
  tripDate: string;
  stopCount: number;
  totalCost: number;
  cover: string | null;
  createdAt: string;
}

export interface TripDetail {
  id: number;
  title: string;
  prompt: string | null;
  conditions: Conditions;
  items: PlanItem[];
  totalCost: number;
  createdAt: string;
}

export interface PoiForm {
  type: PoiType;
  name: string;
  districtId: number;
  adminArea?: string;
  address?: string;
  lng: number;
  lat: number;
  intro?: string;
  illustration: string;
  officialUrl?: string;
  stayMinutes: number;
  fullDay: boolean;
  ticketPrice?: number | null;
  avgCost?: number | null;
  rating?: number | null;
  tags: string[];
}
