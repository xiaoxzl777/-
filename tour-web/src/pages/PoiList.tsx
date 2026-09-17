import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input, Pagination, Select } from 'antd';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { District, PageResult, Poi, PoiType } from '../api/types';
import { poiApi } from '../api/user';
import { errorMessage } from '../api/http';
import Illustration from '../components/Illustration';
import PoiCard from '../components/PoiCard';

const PAGE_SIZE = 12;
const TYPES: { value: '' | PoiType; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'SCENIC', label: '景点' },
  { value: 'RESTAURANT', label: '餐厅' },
];

export default function PoiList() {
  const [params, setParams] = useSearchParams();
  const type = (params.get('type') ?? '') as '' | PoiType;
  const districtId = params.get('districtId') ? Number(params.get('districtId')) : undefined;
  const keyword = params.get('keyword') ?? '';
  const page = Number(params.get('page') ?? 1);

  const [districts, setDistricts] = useState<District[]>([]);
  const [data, setData] = useState<PageResult<Poi> | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(keyword);

  useEffect(() => {
    poiApi.districts().then(setDistricts).catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    setData(null);
    setError('');
    poiApi.list({ type: type || undefined, districtId, keyword: keyword || undefined, page, size: PAGE_SIZE })
      .then(setData)
      .catch(e => setError(errorMessage(e)));
  }, [type, districtId, keyword, page]);

  const update = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  return (
    <div className="wrap page">
      <div className="page-head">
        <div>
          <h1>景点与餐厅</h1>
          <p>收录了广州几个主要片区的景点和老字号餐厅。有官网的，点插画就能打开官网。</p>
        </div>
      </div>
      <div className="filters">
        <div className="tabs" role="tablist" aria-label="类型">
          {TYPES.map(t => (
            <button key={t.label} type="button" className="tab" role="tab" aria-selected={type === t.value} onClick={() => update({ type: t.value })}>
              {t.label}
            </button>
          ))}
        </div>
        <Select allowClear placeholder="全部片区" value={districtId} onChange={value => update({ districtId: value })}
          options={districts.map(d => ({ value: d.id, label: d.name }))} className="filter-select" />
        <Input allowClear value={search} onChange={e => {
          setSearch(e.target.value);
          if (!e.target.value) update({ keyword: undefined });
        }} onPressEnter={() => update({ keyword: search.trim() })}
          prefix={<MagnifyingGlass size={16} />} placeholder="搜索名称，回车查找" className="filter-search" />
      </div>

      {error && <div className="empty"><h3>加载失败</h3><p>{error}</p></div>}
      {!error && data === null && (
        <div className="poi-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton poi-skeleton" />)}</div>
      )}
      {!error && data && data.list.length === 0 && (
        <div className="empty">
          <Illustration name="city-park" alt="" />
          <h3>没有找到符合条件的地点</h3>
          <p>换个片区或者关键词试试。</p>
        </div>
      )}
      {!error && data && data.list.length > 0 && (
        <>
          <div className="poi-grid">
            {data.list.map((poi, i) => <PoiCard key={poi.id} poi={poi} index={i} />)}
          </div>
          {data.total > PAGE_SIZE && (
            <Pagination className="pager" current={page} pageSize={PAGE_SIZE} total={data.total}
              showSizeChanger={false} onChange={p => update({ page: p })} />
          )}
        </>
      )}
    </div>
  );
}
