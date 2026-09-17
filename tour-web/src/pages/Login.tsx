import { App as AntApp, Button, Form, Input, Segmented } from 'antd';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { errorMessage } from '../api/http';
import { authApi } from '../api/user';
import XiaoAvatar from '../components/XiaoAvatar';
import { useApp } from '../store/app';

type Mode = 'login' | 'register';

interface Values {
  username: string;
  password: string;
  nickname?: string;
  confirm?: string;
}

export default function Login() {
  const { message } = AntApp.useApp();
  const { loginUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);

  const redirect = params.get('redirect');
  const target = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';

  const submit = async (values: Values) => {
    setLoading(true);
    try {
      if (mode === 'register') {
        await authApi.register({ username: values.username, password: values.password, nickname: values.nickname });
        message.success('注册成功');
      }
      const result = await authApi.login({ username: values.username, password: values.password });
      loginUser(result);
      // 从首页带过来的那句话（state.prompt）继续带到小萧页面
      navigate(target, { replace: true, state: location.state });
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card panel reveal">
        <div className="auth-head">
          <XiaoAvatar mood={mode === 'login' ? 'PROUD' : 'CARING'} size={64} />
          <div>
            <h1>{mode === 'login' ? '欢迎回来' : '注册账号'}</h1>
            <p>{mode === 'login' ? '先登录，小萧才知道是你。' : '起个昵称，小萧打招呼的时候会叫你。'}</p>
          </div>
        </div>
        <Segmented block value={mode} onChange={value => setMode(value as Mode)}
          options={[{ value: 'login', label: '登录' }, { value: 'register', label: '注册' }]} />
        <Form<Values> layout="vertical" requiredMark={false} onFinish={submit} className="auth-form" key={mode}>
          <Form.Item name="username" label="用户名"
            rules={[{ required: true, message: '请输入用户名' },
              ...(mode === 'register' ? [{ pattern: /^\w{3,20}$/, message: '用户名为 3 到 20 位字母、数字或下划线' }] : [])]}>
            <Input autoComplete="username" size="large" />
          </Form.Item>
          {mode === 'register' && (
            <Form.Item name="nickname" label="昵称（选填）" rules={[{ max: 12, message: '昵称最多 12 个字' }]}>
              <Input size="large" placeholder="不填就用用户名" />
            </Form.Item>
          )}
          <Form.Item name="password" label="密码"
            rules={[{ required: true, message: '请输入密码' },
              ...(mode === 'register' ? [{ min: 6, max: 20, message: '密码为 6 到 20 位' }] : [])]}>
            <Input.Password autoComplete={mode === 'login' ? 'current-password' : 'new-password'} size="large" />
          </Form.Item>
          {mode === 'register' && (
            <Form.Item name="confirm" label="确认密码" dependencies={['password']}
              rules={[{ required: true, message: '请再输入一次密码' },
                ({ getFieldValue }) => ({
                  validator: (_, value) => (!value || value === getFieldValue('password')
                    ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一样'))),
                })]}>
              <Input.Password autoComplete="new-password" size="large" />
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            {mode === 'login' ? '登录' : '注册并登录'}
          </Button>
        </Form>
        <p className="auth-foot">管理员请走 <Link to="/admin/login">后台登录</Link></p>
      </div>
    </div>
  );
}
