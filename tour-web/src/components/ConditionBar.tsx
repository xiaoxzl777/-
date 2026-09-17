import { CalendarBlank, CheckCircle, Clock, Heart, MapPin, PersonSimpleWalk, Prohibit, UsersThree, Wallet, X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import type { Conditions } from '../api/types';
import { dateLabel, money, PACE_LABELS, peopleLabel, shortName } from '../utils/format';

interface Props {
  conditions: Conditions;
  poiNames: Map<number, string>;
  districtNames: Map<number, string>;
  /** 传了就可以点击标签修改条件 */
  onEdit?: () => void;
  /** 传了就可以直接去掉“想去”“不去”里的地点 */
  onRemovePoi?: (kind: 'must' | 'avoid', poiId: number) => void;
  disabled?: boolean;
}

/** 条件标签：小萧整理出来的日期、人数、预算、节奏等 */
export default function ConditionBar({ conditions: c, poiNames, districtNames, onEdit, onRemovePoi, disabled }: Props) {
  const editable = Boolean(onEdit) && !disabled;

  const chip = (label: string, icon: ReactNode, text: ReactNode) => (
    <button key={label} type="button" className={`chip is-outline ${editable ? '' : 'is-static'}`}
      onClick={editable ? onEdit : undefined} disabled={!editable} aria-label={editable ? `修改${label}` : label}>
      {icon}{text}
    </button>
  );

  const placeChip = (kind: 'must' | 'avoid', id: number, name: string) => (
    <span key={`${kind}-${id}`} className="chip is-outline is-static">
      {kind === 'must' ? <CheckCircle size={15} className="ic" /> : <Prohibit size={15} className="ic" />}
      {kind === 'must' ? '想去' : '不去'}：{name}
      {onRemovePoi && !disabled && (
        <button type="button" className="chip-x" onClick={() => onRemovePoi(kind, id)}
          aria-label={kind === 'must' ? `不再必去${name}` : `恢复${name}`}>
          <X size={11} weight="bold" />
        </button>
      )}
    </span>
  );

  const known = (ids: number[], map: Map<number, string>) => ids.filter(id => map.has(id));

  return (
    <div className="conditions">
      {chip('日期', <CalendarBlank size={15} className="ic" />, dateLabel(c.date))}
      {chip('出发时间', <Clock size={15} className="ic" />, `${c.startTime} 出发`)}
      {chip('人数', <UsersThree size={15} className="ic" />, peopleLabel(c))}
      {chip('预算', <Wallet size={15} className="ic" />, c.budget === null ? '预算不限' : `预算 ${money(c.budget, '¥0')}`)}
      {chip('节奏', <PersonSimpleWalk size={15} className="ic" />, `节奏${PACE_LABELS[c.pace]}`)}
      {c.districtIds.length > 0 &&
        chip('片区', <MapPin size={15} className="ic" />, known(c.districtIds, districtNames).map(id => districtNames.get(id)).join('、'))}
      {c.interests.length > 0 && chip('兴趣', <Heart size={15} className="ic" />, c.interests.join('、'))}
      {known(c.mustPoiIds, poiNames).map(id => placeChip('must', id, shortName(poiNames.get(id)!)))}
      {known(c.avoidPoiIds, poiNames).map(id => placeChip('avoid', id, shortName(poiNames.get(id)!)))}
    </div>
  );
}
