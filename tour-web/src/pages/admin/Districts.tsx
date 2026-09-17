import { Plus } from '@phosphor-icons/react';
import { App as AntApp, Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { errorMessage } from '../../api/http';
import type { District } from '../../api/types';

export default function Districts() {
  const { message } = AntApp.useApp();
  const [list, setList] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<District | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ name: string; sort: number }>();

  const load = useCallback(() => {
    setLoading(true);
    adminApi.districts()
      .then(setList)
      .catch(e => message.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(load, [load]);

  const open = (district: District | 'new') => {
    setEditing(district);
    form.setFieldsValue(district === 'new' ? { name: '', sort: (list.at(-1)?.sort ?? 0) + 1 } : district);
  };

  const save = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing === 'new') await adminApi.addDistrict(values);
      else if (editing) await adminApi.updateDistrict(editing.id, values);
      message.success('已保存');
      setEditing(null);
      load();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (district: District) => {
    try {
      await adminApi.deleteDistrict(district.id);
      message.success('已删除');
      load();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>片区管理</h1>
          <p>旅游片区用来分组景点，规划时一天最多跨两个片区。</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => open('new')}>新增片区</Button>
      </div>
      <Table<District> rowKey="id" loading={loading} dataSource={list} pagination={false}
        columns={[
          { title: '排序', dataIndex: 'sort', width: 90 },
          { title: '片区名', dataIndex: 'name' },
          {
            title: '操作', width: 160, render: (_, record) => (
              <Space>
                <Button type="link" onClick={() => open(record)}>编辑</Button>
                <Popconfirm title={`删除“${record.name}”？`} description="片区下还有景点时不能删除" okText="删除" cancelText="取消"
                  okButtonProps={{ danger: true }} onConfirm={() => remove(record)}>
                  <Button type="link" danger>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]} />
      <Modal open={editing !== null} title={editing === 'new' ? '新增片区' : '编辑片区'} okText="保存" cancelText="取消"
        confirmLoading={saving} onOk={save} onCancel={() => setEditing(null)} destroyOnHidden>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="片区名" rules={[{ required: true, whitespace: true, message: '请输入片区名' }, { max: 50, message: '最多 50 个字' }]}>
            <Input placeholder="比如：老城区（越秀、荔湾）" />
          </Form.Item>
          <Form.Item name="sort" label="排序（数字小的在前）" rules={[{ required: true, message: '请输入排序' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
