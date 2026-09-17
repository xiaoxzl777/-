import { ArrowLeft, ArrowUpRight, CalendarX, ChatCircleText, Clock, MapPin, Star, Ticket } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { errorMessage } from '../api/http';
import type { PoiDetail as Detail } from '../api/types';
import { poiApi } from '../api/user';
import Illustration from '../components/Illustration';
import { closedWeekdays, durationLabel, money, openRuleLabel, weekdaysLabel } from '../utils/format';

export default function PoiDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poi, setPoi] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPoi(null);
    setError('');
    poiApi.detail(id!).then(setPoi).catch(e => setError(errorMessage(e)));
  }, [id]);

  if (error) {
    return (
      <div className="wrap page">
        <div className="empty">
          <Illustration name="city-park" alt="" />
          <h3>{error}</h3>
          <Link to="/pois" className="link">回到景点列表</Link>
        </div>
      </div>
    );
  }
  if (!poi) {
    return <div className="wrap page"><div className="skeleton detail-skeleton" /></div>;
  }

  const restaurant = poi.type === 'RESTAURANT';
  const closed = closedWeekdays(poi.openRules);
  const askText = restaurant ? `中午想去${poi.name}吃饭` : `想去${poi.name}`;

  return (
    <div className="wrap page poi-detail">
      <Link to="/pois" className="link back"><ArrowLeft size={16} weight="bold" />景点列表</Link>
      <div className="detail-top">
        <div className="anim-host detail-media">
          <Illustration name={poi.illustration} alt={poi.name} href={poi.officialUrl} className="detail-photo" />
          {poi.officialUrl && <p className="detail-hint">点击插画可以打开官网</p>}
        </div>
        <div className="detail-info">
          <div className="detail-tags">
            <span className="tag is-accent">{restaurant ? '餐厅' : '景点'}</span>
            {poi.fullDay && <span className="tag is-accent">要玩一整天</span>}
            {poi.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
          </div>
          <h1>{poi.name}</h1>
          <div className="meta num">
            {poi.rating !== null && <span><Star size={15} weight="fill" className="ic" />{poi.rating.toFixed(1)}</span>}
            <span><MapPin size={15} className="ic" />{[poi.districtName, poi.adminArea].filter(Boolean).join(' · ')}</span>
          </div>
          <dl className="facts">
            <div>
              <dt><Ticket size={16} className="ic" />{restaurant ? '人均消费' : '门票参考价'}</dt>
              <dd className="num">{restaurant ? money(poi.avgCost) : money(poi.ticketPrice)}</dd>
            </div>
            <div>
              <dt><Clock size={16} className="ic" />{restaurant ? '用餐时长' : '建议游玩'}</dt>
              <dd className="num">{durationLabel(poi.stayMinutes)}</dd>
            </div>
            {poi.address && (
              <div className="is-wide">
                <dt><MapPin size={16} className="ic" />地址</dt>
                <dd>{poi.address}</dd>
              </div>
            )}
          </dl>
          <div className="detail-actions">
            <button type="button" className="btn" onClick={() => navigate('/chat', { state: { prompt: askText } })}>
              <ChatCircleText size={18} />问小萧怎么安排
            </button>
            {poi.officialUrl && (
              <a className="btn is-secondary" href={poi.officialUrl} target="_blank" rel="noopener noreferrer">
                官网<ArrowUpRight size={16} weight="bold" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="detail-sections">
        {poi.intro && (
          <section className="panel detail-card">
            <h2>简介</h2>
            <p>{poi.intro}</p>
          </section>
        )}
        <section className="panel detail-card">
          <h2>开放时间</h2>
          {poi.openRules.length === 0 ? <p className="muted">暂无开放时间数据</p> : (
            <table className="hours num">
              <tbody>
                {poi.openRules.map((rule, i) => (
                  <tr key={i}><th>{weekdaysLabel(rule.weekdays)}</th><td>{openRuleLabel(rule)}</td></tr>
                ))}
                {closed.length > 0 && <tr><th>{weekdaysLabel(closed)}</th><td>{restaurant ? '不营业' : '闭馆'}</td></tr>}
              </tbody>
            </table>
          )}
          {poi.closedDates.length > 0 && (
            <div className="closed-dates">
              <h3><CalendarX size={16} className="ic" />近期闭馆</h3>
              <ul>
                {poi.closedDates.map(d => <li key={d.id} className="num">{d.date}{d.reason ? `：${d.reason}` : ''}</li>)}
              </ul>
            </div>
          )}
          <p className="plan-note">开放时间和票价以官网公布为准。</p>
        </section>
      </div>
    </div>
  );
}
