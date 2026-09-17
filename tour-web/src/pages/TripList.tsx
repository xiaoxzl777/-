import { ArrowRight, CalendarBlank, MapPin, Trash, Wallet } from '@phosphor-icons/react';
import { App as AntApp, Pagination, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { errorMessage } from '../api/http';
import type { PageResult, TripSummary } from '../api/types';
import { tripApi } from '../api/user';
import Illustration from '../components/Illustration';
import XiaoAvatar from '../components/XiaoAvatar';
import { dateLabel, money } from '../utils/format';

const PAGE_SIZE = 9;

export default function TripList() {
  const { message } = AntApp.useApp();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResult<TripSummary> | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    tripApi.list(page, PAGE_SIZE).then(setData).catch(e => setError(errorMessage(e)));
  }, [page]);

  useEffect(load, [load]);

  const remove = async (trip: TripSummary) => {
    try {
      await tripApi.remove(trip.id);
      message.success('已删除');
      if (data && data.list.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  return (
    <div className="wrap page">
      <div className="page-head">
        <div>
          <h1>我的行程</h1>
          <p>保存过的行程都在这里，点开可以看时间线和地图。</p>
        </div>
        <Link to="/chat" className="btn is-small">再排一个<ArrowRight size={16} weight="bold" className="ic-arrow" /></Link>
      </div>

      {error && <div className="empty"><h3>加载失败</h3><p>{error}</p></div>}
      {!error && data === null && (
        <div className="trip-grid">{[0, 1, 2].map(i => <div key={i} className="skeleton trip-skeleton" />)}</div>
      )}
      {!error && data && data.total === 0 && (
        <div className="empty">
          <XiaoAvatar mood="CARING" size={72} />
          <h3>还没有保存的行程</h3>
          <p>去跟小萧说说你的出行想法，排好了点“保存行程”就会出现在这里。</p>
          <Link to="/chat" className="btn is-small">去问小萧</Link>
        </div>
      )}
      {!error && data && data.list.length > 0 && (
        <>
          <ul className="trip-grid">
            {data.list.map((trip, i) => (
              <li key={trip.id} className="trip-card panel anim-host reveal" style={{ '--i': i } as React.CSSProperties}>
                <Link to={`/trips/${trip.id}`} className="trip-cover" aria-label={`查看${trip.title}`}>
                  <Illustration name={trip.cover ?? 'city-park'} alt="" />
                </Link>
                <div className="trip-body">
                  <h3><Link to={`/trips/${trip.id}`}>{trip.title}</Link></h3>
                  <div className="meta num">
                    <span><CalendarBlank size={14} className="ic" />{dateLabel(trip.tripDate)}</span>
                    <span><MapPin size={14} className="ic" />{trip.stopCount} 个景点</span>
                    <span><Wallet size={14} className="ic" />{money(trip.totalCost, '¥0')}</span>
                  </div>
                  <div className="trip-foot">
                    <span className="muted">保存于 {dayjs(trip.createdAt).format('M月D日 HH:mm')}</span>
                    <Popconfirm title="删除这份行程？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => remove(trip)}>
                      <button type="button" className="icon-btn" aria-label={`删除${trip.title}`}><Trash size={18} /></button>
                    </Popconfirm>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {data.total > PAGE_SIZE && (
            <Pagination className="pager" current={page} pageSize={PAGE_SIZE} total={data.total} showSizeChanger={false} onChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
