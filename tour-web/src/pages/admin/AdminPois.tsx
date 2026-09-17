import { Plus } from '@phosphor-icons/react';
import { App as AntApp, Button, Input, Select, Space, Switch, Table } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { adminApi } from '../../api/admin';
import { errorMessage } from '../../api/http';
import type { District, PageResult, Poi, PoiQuery } from '../../api/types';
import Illustration from '../../components/Illustration';
import { money } from '../../utils/format';

export default function AdminPois() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<District[]>([]);
  const [query, setQuery] = useState<PoiQuery>({ page: 1, size: 10 });
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<PageResult<Poi>>({ list: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.districts().then(setDistricts).catch(e => message.error(errorMessage(e)));
  }, [message]);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.pois(query)
      .then(setData)
      .catch(e => message.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [query, message]);

  useEffect(load, [load]);

  const toggleStatus = async (poi: Poi, online: boolean) => {
    try {
      await adminApi.updateStatus(poi.id, online ? 'ONLINE' : 'OFFLINE');
      message.success(online ? `${poi.name} 已上线` : `${poi.name} 已下线`);
      load();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>景点管理</h1>
          <p>下线的景点不会出现在景点列表和规划里，已保存的行程里仍然能看到。</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/admin/pois/new')}>新增景点</Button>
      </div>
      <Space wrap className="admin-filters">
        <Select allowClear placeholder="全部片区" style={{ width: 200 }} value={query.districtId}
          options={districts.map(d => ({ value: d.id, label: d.name }))}
          onChange={districtId => setQuery({ ...query, districtId, page: 1 })} />
        <Select allowClear placeholder="全部类型" style={{ width: 120 }} value={query.type}
          options={[{ value: 'SCENIC', label: '景点' }, { value: 'RESTAURANT', label: '餐厅' }]}
          onChange={type => setQuery({ ...query, type, page: 1 })} />
        <Select allowClear placeholder="全部状态" style={{ width: 120 }} value={query.status}
          options={[{ value: 'ONLINE', label: '已上线' }, { value: 'OFFLINE', label: '已下线' }]}
          onChange={status => setQuery({ ...query, status, page: 1 })} />
        <Input.Search allowClear placeholder="搜索名称" style={{ width: 220 }} value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onSearch={value => setQuery({ ...query, keyword: value.trim() || undefined, page: 1 })} />
      </Space>
      <Table<Poi> rowKey="id" loading={loading} dataSource={data.list} scroll={{ x: 860 }}
        pagination={{
          current: query.page, pageSize: query.size, total: data.total, showSizeChanger: false,
          showTotal: total => `共 ${total} 个`, onChange: page => setQuery({ ...query, page }),
        }}
        columns={[
          {
            title: '名称', dataIndex: 'name', render: (_, poi) => (
              <div className="admin-poi-name">
                <Illustration name={poi.illustration} alt="" className="admin-thumb" />
                <Link to={`/admin/pois/${poi.id}`}>{poi.name}</Link>
              </div>
            ),
          },
          { title: '类型', dataIndex: 'type', width: 80, render: type => (type === 'SCENIC' ? '景点' : '餐厅') },
          { title: '片区', dataIndex: 'districtName', width: 210 },
          {
            title: '价格', width: 110, render: (_, poi) => (poi.type === 'SCENIC' ? money(poi.ticketPrice) : `人均 ${money(poi.avgCost)}`),
          },
          { title: '评分', dataIndex: 'rating', width: 70, render: rating => rating?.toFixed(1) ?? '—' },
          {
            title: '上线', dataIndex: 'status', width: 100, render: (_, poi) => (
              <Switch checked={poi.status === 'ONLINE'} checkedChildren="上线" unCheckedChildren="下线"
                onChange={checked => toggleStatus(poi, checked)} />
            ),
          },
          {
            title: '操作', width: 80, fixed: 'right', render: (_, poi) => <Link to={`/admin/pois/${poi.id}`}>编辑</Link>,
          },
        ]} />
    </div>
  );
}
