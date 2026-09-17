import { ArrowUpRight, Car, Clock, ForkKnife, PersonSimpleWalk, Ticket, Train, X } from '@phosphor-icons/react';
import type { Conditions, PlanItem, TravelMode } from '../api/types';
import { distanceLabel, durationLabel, MODE_LABELS, minutesBetween, money, shortName } from '../utils/format';
import Illustration from './Illustration';

const MODE_ICONS: Record<TravelMode, typeof Car> = { WALK: PersonSimpleWalk, METRO: Train, TAXI: Car };

interface TimelineProps {
  items: PlanItem[];
  activeSeq: number | null;
  onHover: (seq: number | null) => void;
  /** 传了才显示“删掉这一站” */
  onRemove?: (item: PlanItem) => void;
  disabled?: boolean;
}

/** 行程时间线：每一站的时间、地点、花费，以及到下一站的交通（估算） */
export default function Timeline({ items, activeSeq, onHover, onRemove, disabled }: TimelineProps) {
  return (
    <ol className="timeline">
      {items.map((item, index) => {
        const restaurant = item.type === 'RESTAURANT';
        const continued = items.slice(0, index).some(prev => prev.poiId === item.poiId);
        const minutes = minutesBetween(item.startTime, item.endTime);
        const ModeIcon = item.nextMode ? MODE_ICONS[item.nextMode] : null;
        return (
          <li key={`${item.seq}-${item.poiId}`} className="reveal" style={{ '--i': index } as React.CSSProperties}>
            <div className={`stop anim-host ${activeSeq === item.seq ? 'is-hot' : ''}`}
              onMouseEnter={() => onHover(item.seq)} onMouseLeave={() => onHover(null)}>
              <div className="stop-time num">{item.startTime}<small>{item.endTime}</small></div>
              <div className="stop-rail"><span className={`stop-no num ${restaurant ? 'is-meal' : ''}`}>{item.seq}</span></div>
              <div className="stop-body">
                <Illustration name={item.illustration} alt={item.name} className="stop-thumb" href={item.officialUrl} />
                <div className="stop-main">
                  <h3>
                    {shortName(item.name)}
                    {restaurant && <span className="tag is-accent">午餐</span>}
                    {continued && <span className="tag is-muted">接着玩</span>}
                  </h3>
                  <div className="meta num">
                    <span>
                      {restaurant ? <ForkKnife size={14} className="ic" /> : <Clock size={14} className="ic" />}
                      {restaurant ? '用餐' : '游玩'} {durationLabel(minutes)}
                    </span>
                    {!continued && (
                      <span><Ticket size={14} className="ic" />{restaurant ? `约 ${money(item.cost)}` : money(item.cost)}</span>
                    )}
                    {item.officialUrl && !continued && (
                      <a className="site-link" href={item.officialUrl} target="_blank" rel="noopener noreferrer">
                        官网<ArrowUpRight size={12} weight="bold" className="ic" />
                      </a>
                    )}
                  </div>
                </div>
                {onRemove && (
                  <button type="button" className="icon-btn stop-remove" disabled={disabled}
                    onClick={() => onRemove(item)} aria-label={`删掉${item.name}`} title="删掉这一站，重新排">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            {item.nextMode && ModeIcon && (
              <div className="leg">
                <span />
                <span className="leg-rail" />
                <span className="leg-text num">
                  <ModeIcon size={14} className="ic" />
                  {MODE_LABELS[item.nextMode]} {item.nextMinutes} 分钟
                  {item.nextMeters ? ` · ${distanceLabel(item.nextMeters)}` : ''}
                  {item.nextCost ? ` · 约 ${money(item.nextCost)}` : ''}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface SummaryProps {
  items: PlanItem[];
  totalCost: number;
  conditions: Conditions;
}

/** 行程概要：起止时间、景点数、预计花费 */
export function PlanSummary({ items, totalCost, conditions }: SummaryProps) {
  if (items.length === 0) return null;
  const scenic = new Set(items.filter(i => i.type === 'SCENIC').map(i => i.poiId)).size;
  const meals = items.filter(i => i.type === 'RESTAURANT').length;
  const left = conditions.budget === null ? null : conditions.budget - totalCost;
  return (
    <div className="summary panel">
      <div>
        <span>时间</span>
        <b className="num">{items[0].startTime}–{items[items.length - 1].endTime}</b>
      </div>
      <div>
        <span>景点</span>
        <b className="num">{scenic} 个</b>
        {meals > 0 && <small>含午餐 {meals} 次</small>}
      </div>
      <div>
        <span>预计花费</span>
        <b className="num">{money(totalCost, '¥0')}</b>
        <small>{left === null ? '预算不限' : `预算内，还剩 ${money(Math.max(0, left), '¥0')}`}</small>
      </div>
    </div>
  );
}
