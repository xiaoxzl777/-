import { Path } from '@phosphor-icons/react';
import { App as AntApp, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { adminApi } from '../../api/admin';
import { errorMessage } from '../../api/http';
import { useApp } from '../../store/app';

export default function AdminLogin() {
  const { message } = AntApp.useApp();
  const { adminToken, loginAdmin } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (adminToken) return <Navigate to="/admin/pois" replace />;

  const submit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await adminApi.login(values);
      loginAdmin(result.token);
      navigate('/admin/pois', { replace: true });
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page is-admin">
      <div className="auth-card panel reveal">
        <div className="auth-head">
          <span className="brand-mark is-large"><Path size={28} weight="bold" /></span>
          <div>
            <h1>悠行 · 后台管理</h1>
            <p>维护片区、景点、开放时间和闭馆日。</p>
          </div>
        </div>
        <Form layout="vertical" requiredMark={false} onFinish={submit} className="auth-form">
          <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input size="large" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size="large" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>登录后台</Button>
        </Form>
        <p className="auth-foot"><Link to="/">回到网站首页</Link></p>
      </div>
    </div>
  );
}
