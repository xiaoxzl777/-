import dayjs from 'dayjs';
import type { Conditions, OpenRule, Pace, TravelMode } from '../api/types';

export const PACE_LABELS: Record<Pace, string> = { RELAXED: '轻松', NORMAL: '适中', TIGHT: '紧凑' };
export const MODE_LABELS: Record<TravelMode, string> = { WALK: '步行', METRO: '地铁', TAXI: '打车' };
export const INTEREST_OPTIONS = ['历史人文', '岭南建筑', '博物馆', '自然风光', '城市地标', '夜景', '拍照', '美食', '购物', '宗教文化', '动物', '亲子'];
export const POI_TAG_OPTIONS = [...INTEREST_OPTIONS, '适合长辈', '室内', '室外', '早茶', '粤菜', '老字号', '园林'];

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];

/** 2026-09-19 → 9月19日 周六 */
export function dateLabel(date: string): string {
  const d = dayjs(date);
  return `${d.month() + 1}月${d.date()}日 周${WEEK[(d.day() + 6) % 7]}`;
}

export function money(value: number | null | undefined, freeText = '免费'): string {
  if (value === null || value === undefined) return '—';
  if (value === 0) return freeText;
  return `¥${Number.isInteger(value) ? value : value.toFixed(1)}`;
}

/** 90 → 1.5 小时；45 → 45 分钟 */
export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} 小时`;
}

export function distanceLabel(meters: number | null): string {
  if (!meters) return '';
  return meters < 1000 ? `${meters} 米` : `${(meters / 1000).toFixed(1)} 公里`;
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function peopleLabel(c: Pick<Conditions, 'adults' | 'seniors' | 'children'>): string {
  const total = c.adults + c.seniors + c.children;
  const extra = [c.seniors ? `${c.seniors} 位老人` : '', c.children ? `${c.children} 个儿童` : ''].filter(Boolean);
  return extra.length ? `${total} 人，含 ${extra.join('、')}` : `${total} 人`;
}

/** [2,3,4,5,6,7] → 周二至周日；[1..7] → 每天；[1,3] → 周一、周三 */
export function weekdaysLabel(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return '每天';
  const continuous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (continuous && sorted.length >= 3) return `周${WEEK[sorted[0] - 1]}至周${WEEK[sorted[sorted.length - 1] - 1]}`;
  return sorted.map(d => `周${WEEK[d - 1]}`).join('、');
}

export function openRuleLabel(rule: OpenRule): string {
  const hours = `${rule.openTime}–${rule.closeTime}`;
  return rule.lastEntryTime && rule.lastEntryTime !== rule.closeTime ? `${hours}（${rule.lastEntryTime} 停止入场）` : hours;
}

/** 一周里没有开放规则的日子，比如 [1] 表示周一闭馆 */
export function closedWeekdays(rules: OpenRule[]): number[] {
  const open = new Set(rules.flatMap(r => r.weekdays));
  return [1, 2, 3, 4, 5, 6, 7].filter(d => !open.has(d));
}

export function shortName(name: string): string {
  return name.replace(/[（(].*?[）)]/g, '').trim() || name;
}
