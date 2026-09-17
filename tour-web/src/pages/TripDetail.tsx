import { ArrowLeft, Quotes, Trash } from '@phosphor-icons/react';
import { App as AntApp, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { errorMessage } from '../api/http';
import type { District, TripDetail as Detail } from '../api/types';
import { poiApi, tripApi } from '../api/user';
import ConditionBar from '../components/ConditionBar';
import Illustration from '../components/Illustration';
import RouteMap from '../components/RouteMap';
import Timeline, { PlanSummary } from '../components/Timeline';
import { dateLabel } from '../utils/format';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [trip, setTrip] = useState<Detail | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [poiNames, setPoiNames] = useState<Map<number, string>>(new Map());
  const [error, setError] = useState('');
  const [activeSeq, setActiveSeq] = useState<number | null>(null);

  useEffect(() => {
    tripApi.detail(id!).then(setTrip).catch(e => setError(errorMessage(e)));
    poiApi.districts().then(setDistricts).catch(() => setDistricts([]));
    poiApi.list({ size: 100 }).then(page => setPoiNames(new Map(page.list.map(p => [p.id, p.name])))).catch(() => undefined);
  }, [id]);

  const names = useMemo(() => {
    const map = new Map(poiNames);
    trip?.items.forEach(item => map.set(item.poiId, item.name));
    return map;
  }, [poiNames, trip]);
  const districtNames = useMemo(() => new Map(districts.map(d => [d.id, d.name])), [districts]);

  const remove = async () => {
    try {
      await tripApi.remove(Number(id));
      message.success('已删除');
      navigate('/trips', { replace: true });
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  if (error) {
    return (
      <div className="wrap page">
        <div className="empty">
          <Illustration name="city-park" alt="" />
          <h3>{error}</h3>
          <Link to="/trips" className="link">回到我的行程</Link>
        </div>
      </div>
    );
  }
  if (!trip) return <div className="wrap page"><div className="skeleton detail-skeleton" /></div>;

  return (
    <div className="page trip-detail">
      <div className="wrap-wide">
        <Link to="/trips" className="link back"><ArrowLeft size={16} weight="bold" />我的行程</Link>
        <div className="page-head">
          <div>
            <h1>{trip.title}</h1>
            <p>出行日期 {dateLabel(trip.conditions.date)} · 保存于 {dayjs(trip.createdAt).format('M月D日 HH:mm')}</p>
          </div>
          <Popconfirm title="删除这份行程？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={remove}>
            <button type="button" className="btn is-secondary is-small"><Trash size={16} />删除</button>
          </Popconfirm>
        </div>
        {trip.prompt && (
          <blockquote className="prompt-quote"><Quotes size={18} weight="fill" className="ic" />{trip.prompt}</blockquote>
        )}
        <ConditionBar conditions={trip.conditions} poiNames={names} districtNames={districtNames} />
        <div className="plan-grid">
          <div className="plan-list">
            <PlanSummary items={trip.items} totalCost={trip.totalCost} conditions={trip.conditions} />
            <Timeline items={trip.items} activeSeq={activeSeq} onHover={setActiveSeq} />
            <p className="plan-note">开放时间和票价以官网为准；交通按直线距离估算。</p>
          </div>
          <RouteMap items={trip.items} activeSeq={activeSeq} onHover={setActiveSeq} />
        </div>
      </div>
    </div>
  );
}
