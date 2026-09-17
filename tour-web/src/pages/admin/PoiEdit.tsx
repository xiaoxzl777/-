import { ArrowLeft, Plus, Trash } from '@phosphor-icons/react';
import {
  App as AntApp, Button, Card, Checkbox, DatePicker, Form, Input, InputNumber, Popconfirm, Segmented, Select, Space, Switch, Table, TimePicker,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { adminApi } from '../../api/admin';
import { errorMessage } from '../../api/http';
import type { ClosedDate, District, PoiDetail, PoiForm } from '../../api/types';
import Illustration from '../../components/Illustration';
import { ILLUSTRATIONS } from '../../components/illustrations';
import { POI_TAG_OPTIONS } from '../../utils/format';

const WEEKDAY_OPTIONS = ['一', '二', '三', '四', '五', '六', '日'].map((d, i) => ({ value: i + 1, label: `周${d}` }));

interface RuleRow {
  weekdays: number[];
  openTime: Dayjs;
  closeTime: Dayjs;
  lastEntryTime?: Dayjs | null;
}

const time = (value: string) => dayjs(`2000-01-01 ${value}`);

export default function PoiEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [districts, setDistricts] = useState<District[]>([]);
  const [poi, setPoi] = useState<PoiDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [form] = Form.useForm<PoiForm>();
  const [rulesForm] = Form.useForm<{ rules: RuleRow[] }>();
  const [dateForm] = Form.useForm<{ date: Dayjs; reason?: string }>();
  const type = Form.useWatch('type', form);
  const illustration = Form.useWatch('illustration', form);

  const load = useCallback(() => {
    if (isNew) return;
    adminApi.poi(id!)
      .then(detail => {
        setPoi(detail);
        form.setFieldsValue({
          ...detail,
          adminArea: detail.adminArea ?? undefined,
          address: detail.address ?? undefined,
          intro: detail.intro ?? undefined,
          officialUrl: detail.officialUrl ?? undefined,
        });
        rulesForm.setFieldsValue({
          rules: detail.openRules.map(r => ({
            weekdays: r.weekdays,
            openTime: time(r.openTime),
            closeTime: time(r.closeTime),
            lastEntryTime: r.lastEntryTime ? time(r.lastEntryTime) : null,
          })),
        });
      })
      .catch(e => message.error(errorMessage(e)));
  }, [id, isNew, form, rulesForm, message]);

  useEffect(() => {
    adminApi.districts().then(setDistricts).catch(e => message.error(errorMessage(e)));
    if (isNew) {
      form.setFieldsValue({ type: 'SCENIC', stayMinutes: 90, fullDay: false, ticketPrice: 0, rating: 4.5, tags: [], illustration: 'city-park' });
    }
    load();
  }, [isNew, load, form, message]);

  const saveBasic = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (isNew) {
        const newId = await adminApi.addPoi(values);
        message.success('已新增，接着填写开放时间');
        navigate(`/admin/pois/${newId}`, { replace: true });
      } else {
        await adminApi.updatePoi(Number(id), values);
        message.success('基本信息已保存');
        load();
      }
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const saveRules = async () => {
    const { rules = [] } = await rulesForm.validateFields();
    setSavingRules(true);
    try {
      await adminApi.replaceOpenRules(Number(id), rules.map(r => ({
        weekdays: r.weekdays,
        openTime: r.openTime.format('HH:mm'),
        closeTime: r.closeTime.format('HH:mm'),
        lastEntryTime: r.lastEntryTime ? r.lastEntryTime.format('HH:mm') : null,
      })));
      message.success('开放时间已保存');
      load();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setSavingRules(false);
    }
  };

  const addClosedDate = async () => {
    const values = await dateForm.validateFields();
    try {
      await adminApi.addClosedDate(Number(id), { date: values.date.format('YYYY-MM-DD'), reason: values.reason?.trim() || undefined });
      message.success('已添加闭馆日');
      dateForm.resetFields();
      load();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  const removeClosedDate = async (item: ClosedDate) => {
    try {
      await adminApi.deleteClosedDate(Number(id), item.id);
      message.success('已删除');
      load();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  return (
    <div className="admin-page">
      <Link to="/admin/pois" className="link back"><ArrowLeft size={16} weight="bold" />景点列表</Link>
      <div className="admin-head">
        <div>
          <h1>{isNew ? '新增景点' : poi?.name ?? '编辑景点'}</h1>
          <p>{isNew ? '先保存基本信息，再填写开放时间和闭馆日。' : '三块内容分别保存。'}</p>
        </div>
      </div>

      <Card title="基本信息" className="admin-card" extra={<Button type="primary" loading={saving} onClick={saveBasic}>保存基本信息</Button>}>
        <div className="poi-edit">
          <Form form={form} layout="vertical" requiredMark={false} className="poi-edit-form">
            <div className="form-row">
              <Form.Item name="type" label="类型">
                <Segmented options={[{ value: 'SCENIC', label: '景点' }, { value: 'RESTAURANT', label: '餐厅' }]} />
              </Form.Item>
              <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true, message: '请输入名称' }, { max: 50 }]}>
                <Input />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item name="districtId" label="片区" rules={[{ required: true, message: '请选择片区' }]}>
                <Select options={districts.map(d => ({ value: d.id, label: d.name }))} />
              </Form.Item>
              <Form.Item name="adminArea" label="行政区" rules={[{ max: 20 }]}>
                <Input placeholder="比如：荔湾区" />
              </Form.Item>
            </div>
            <Form.Item name="address" label="地址" rules={[{ max: 200 }]}>
              <Input />
            </Form.Item>
            <div className="form-row">
              <Form.Item name="lng" label="经度（高德坐标）" rules={[{ required: true, message: '请输入经度' }]}>
                <InputNumber min={73} max={136} precision={6} step={0.001} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="lat" label="纬度（高德坐标）" rules={[{ required: true, message: '请输入纬度' }]}>
                <InputNumber min={3} max={54} precision={6} step={0.001} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item name="illustration" label="插画" rules={[{ required: true, message: '请选择插画' }]}>
                <Select options={ILLUSTRATIONS.map(i => ({ value: i.name, label: i.label }))} />
              </Form.Item>
              <Form.Item name="officialUrl" label="官网（没有就不填）"
                rules={[{ pattern: /^https?:\/\/\S+$/, message: '要以 http:// 或 https:// 开头' }]}>
                <Input placeholder="https://" />
              </Form.Item>
            </div>
            <div className="form-row is-three">
              <Form.Item name="stayMinutes" label={type === 'RESTAURANT' ? '用餐时长（分钟）' : '建议游玩（分钟）'} rules={[{ required: true, message: '请输入时长' }]}>
                <InputNumber min={10} max={720} step={10} precision={0} style={{ width: '100%' }} />
              </Form.Item>
              {type === 'RESTAURANT' ? (
                <Form.Item name="avgCost" label="人均消费（元）" rules={[{ required: true, message: '请输入人均消费' }]}>
                  <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              ) : (
                <Form.Item name="ticketPrice" label="门票（元，0 为免费）">
                  <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              )}
              <Form.Item name="rating" label="评分">
                <InputNumber min={0} max={5} step={0.1} precision={1} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            {type !== 'RESTAURANT' && (
              <Form.Item name="fullDay" label="全天型景点（点名要去时当天只排它）" valuePropName="checked">
                <Switch />
              </Form.Item>
            )}
            <Form.Item name="tags" label="标签（规划时按兴趣和同行人匹配）">
              <Select mode="tags" options={POI_TAG_OPTIONS.map(t => ({ value: t, label: t }))} />
            </Form.Item>
            <Form.Item name="intro" label="简介" rules={[{ max: 2000 }]}>
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </Form>
          <div className="poi-edit-preview anim-host">
            <Illustration name={illustration || 'city-park'} alt="插画预览" />
            <p className="muted">插画预览，鼠标放上去会动</p>
          </div>
        </div>
      </Card>

      {!isNew && (
        <Card title="开放时间" className="admin-card" extra={<Button type="primary" loading={savingRules} onClick={saveRules}>保存开放时间</Button>}>
          <p className="muted">没有列出的星期视为闭馆（不营业）。停止入场时间可以不填，不填就按关门时间算。</p>
          <Form form={rulesForm} layout="vertical" requiredMark={false}>
            <Form.List name="rules">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <div key={field.key} className="rule-row">
                      <Form.Item name={[field.name, 'weekdays']} label="星期" rules={[{ required: true, message: '至少选一天' }]}>
                        <Checkbox.Group options={WEEKDAY_OPTIONS} />
                      </Form.Item>
                      <Space wrap align="end">
                        <Form.Item name={[field.name, 'openTime']} label="开门" rules={[{ required: true, message: '必填' }]}>
                          <TimePicker format="HH:mm" minuteStep={5} needConfirm={false} />
                        </Form.Item>
                        <Form.Item name={[field.name, 'closeTime']} label="关门" rules={[{ required: true, message: '必填' }]}>
                          <TimePicker format="HH:mm" minuteStep={5} needConfirm={false} />
                        </Form.Item>
                        <Form.Item name={[field.name, 'lastEntryTime']} label="停止入场">
                          <TimePicker format="HH:mm" minuteStep={5} needConfirm={false} />
                        </Form.Item>
                        <Form.Item>
                          <Button danger type="text" icon={<Trash size={16} />} onClick={() => remove(field.name)}>删除</Button>
                        </Form.Item>
                      </Space>
                    </div>
                  ))}
                  <Space wrap>
                    <Button icon={<Plus size={14} />} onClick={() => add({ weekdays: [1, 2, 3, 4, 5, 6, 7], openTime: time('09:00'), closeTime: time('17:30') })}>
                      添加：每天
                    </Button>
                    <Button icon={<Plus size={14} />} onClick={() => add({ weekdays: [2, 3, 4, 5, 6, 7], openTime: time('09:00'), closeTime: time('17:00'), lastEntryTime: time('16:00') })}>
                      添加：周二至周日（周一闭馆）
                    </Button>
                  </Space>
                </>
              )}
            </Form.List>
          </Form>
        </Card>
      )}

      {!isNew && poi && (
        <Card title="闭馆日" className="admin-card">
          <Form form={dateForm} layout="inline" className="closed-form">
            <Form.Item name="date" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker disabledDate={d => d.isBefore(dayjs(), 'day')} />
            </Form.Item>
            <Form.Item name="reason" rules={[{ max: 100 }]}>
              <Input placeholder="原因，比如：设备检修" style={{ width: 240 }} />
            </Form.Item>
            <Button type="primary" onClick={addClosedDate}>添加</Button>
          </Form>
          <Table<ClosedDate> rowKey="id" size="small" pagination={false} dataSource={poi.closedDates}
            locale={{ emptyText: '没有设置闭馆日' }}
            columns={[
              { title: '日期', dataIndex: 'date', width: 160 },
              { title: '原因', dataIndex: 'reason', render: reason => reason ?? '—' },
              {
                title: '操作', width: 90, render: (_, item) => (
                  <Popconfirm title="删除这个闭馆日？" okText="删除" cancelText="取消" onConfirm={() => removeClosedDate(item)}>
                    <Button type="link" danger>删除</Button>
                  </Popconfirm>
                ),
              },
            ]} />
        </Card>
      )}
    </div>
  );
}
