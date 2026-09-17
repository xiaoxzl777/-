import { DatePicker, Form, InputNumber, Modal, Segmented, Select, Switch, TimePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';
import type { Conditions, District, Pace, Poi } from '../api/types';
import { INTEREST_OPTIONS, PACE_LABELS } from '../utils/format';

interface Props {
  open: boolean;
  conditions: Conditions;
  pois: Poi[];
  districts: District[];
  onCancel: () => void;
  onSubmit: (conditions: Conditions) => void;
}

interface FormValues {
  date: Dayjs;
  startTime: Dayjs;
  adults: number;
  seniors: number;
  children: number;
  unlimited: boolean;
  budget: number | null;
  pace: Pace;
  districtIds: number[];
  interests: string[];
  mustPoiIds: number[];
  avoidPoiIds: number[];
}

/** 修改条件的弹窗，确定后按新条件重排 */
export default function ConditionEditor({ open, conditions, pois, districts, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const unlimited = Form.useWatch('unlimited', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      ...conditions,
      date: dayjs(conditions.date),
      startTime: dayjs(`2000-01-01 ${conditions.startTime}`),
      unlimited: conditions.budget === null,
      budget: conditions.budget ?? 300,
    });
  }, [open, conditions, form]);

  const submit = async () => {
    const v = await form.validateFields();
    const avoid = v.avoidPoiIds ?? [];
    onSubmit({
      date: v.date.format('YYYY-MM-DD'),
      startTime: v.startTime.format('HH:mm'),
      adults: v.adults,
      seniors: v.seniors,
      children: v.children,
      budget: v.unlimited ? null : v.budget,
      pace: v.pace,
      districtIds: v.districtIds ?? [],
      interests: v.interests ?? [],
      mustPoiIds: (v.mustPoiIds ?? []).filter(id => !avoid.includes(id)),
      avoidPoiIds: avoid,
    });
  };

  const poiOptions = pois.map(p => ({ value: p.id, label: p.type === 'RESTAURANT' ? `${p.name}（餐厅）` : p.name }));

  return (
    <Modal open={open} title="修改条件" okText="按新条件重排" cancelText="取消" onCancel={onCancel} onOk={submit} width={560} destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark={false} className="condition-form">
        <div className="form-row">
          <Form.Item name="date" label="出行日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={d => d.isBefore(dayjs(), 'day')} allowClear={false} />
          </Form.Item>
          <Form.Item name="startTime" label="出发时间" rules={[{ required: true, message: '请选择出发时间' }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} allowClear={false} needConfirm={false} />
          </Form.Item>
        </div>
        <div className="form-row is-three">
          <Form.Item name="adults" label="成人">
            <InputNumber min={1} max={20} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="seniors" label="老人">
            <InputNumber min={0} max={10} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="children" label="儿童">
            <InputNumber min={0} max={10} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div className="form-row">
          <Form.Item label="预算（元，所有人合计）" required={false}>
            <div className="budget-field">
              <Form.Item name="budget" noStyle>
                <InputNumber min={0} max={100000} step={50} precision={0} disabled={unlimited} style={{ flex: 1 }} />
              </Form.Item>
              <Form.Item name="unlimited" valuePropName="checked" noStyle>
                <Switch checkedChildren="不限" unCheckedChildren="限定" />
              </Form.Item>
            </div>
          </Form.Item>
          <Form.Item name="pace" label="节奏">
            <Segmented block options={(Object.keys(PACE_LABELS) as Pace[]).map(p => ({ value: p, label: PACE_LABELS[p] }))} />
          </Form.Item>
        </div>
        <Form.Item name="districtIds" label="想去的片区">
          <Select mode="multiple" allowClear placeholder="不限" options={districts.map(d => ({ value: d.id, label: d.name }))} />
        </Form.Item>
        <Form.Item name="interests" label="兴趣">
          <Select mode="multiple" allowClear placeholder="不限" options={INTEREST_OPTIONS.map(t => ({ value: t, label: t }))} />
        </Form.Item>
        <Form.Item name="mustPoiIds" label="一定要去">
          <Select mode="multiple" allowClear placeholder="没有" options={poiOptions} optionFilterProp="label" />
        </Form.Item>
        <Form.Item name="avoidPoiIds" label="不去">
          <Select mode="multiple" allowClear placeholder="没有" options={poiOptions} optionFilterProp="label" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
