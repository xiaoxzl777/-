import { ArrowUpRight, Clock, ForkKnife, Star } from '@phosphor-icons/react';
import { Link } from 'react-router';
import type { Poi } from '../api/types';
import { durationLabel, money } from '../utils/format';
import Illustration from './Illustration';

interface Props {
  poi: Poi;
  feature?: boolean;
  intro?: string | null;
  index?: number;
}

/** 景点卡片：插画（有官网可点）、名称、评分、建议时长、价格、标签 */
export default function PoiCard({ poi, feature = false, intro, index = 0 }: Props) {
  const restaurant = poi.type === 'RESTAURANT';
  const price = restaurant ? `人均 ${money(poi.avgCost)}` : money(poi.ticketPrice);
  return (
    <article className={`poi anim-host reveal ${feature ? 'is-feature' : ''}`} style={{ '--i': index } as React.CSSProperties}>
      <Illustration name={poi.illustration} alt={poi.name} href={poi.officialUrl} />
      <div className="poi-body">
        <div className="poi-title">
          <h3>
            <Link to={`/pois/${poi.id}`} className="poi-name">{poi.name}</Link>
          </h3>
          {poi.officialUrl && (
            <a className="site-link poi-site" href={poi.officialUrl} target="_blank" rel="noopener noreferrer">
              官网<ArrowUpRight size={13} weight="bold" className="ic" />
            </a>
          )}
        </div>
        {feature && intro && <p className="poi-desc">{intro}</p>}
        <div className="meta num">
          {poi.rating !== null && <span><Star size={14} weight="fill" className="ic" />{poi.rating.toFixed(1)}</span>}
          <span>
            {restaurant ? <ForkKnife size={14} className="ic" /> : <Clock size={14} className="ic" />}
            {restaurant ? '用餐' : '建议'} {durationLabel(poi.stayMinutes)}
          </span>
          {poi.districtName && <span className="poi-district">{poi.districtName}</span>}
        </div>
        <div className="poi-foot">
          <div className="poi-tags">
            {poi.fullDay && <span className="tag is-accent">全天</span>}
            {poi.tags.slice(0, feature ? 4 : 2).map(tag => <span className="tag" key={tag}>{tag}</span>)}
          </div>
          <span className={`tag num ${price === '免费' ? 'is-accent' : 'is-muted'}`}>{price}</span>
        </div>
      </div>
    </article>
  );
}
