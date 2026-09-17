import { House, MapPinArea, MapTrifold, MoonStars, Path, SignOut, SunDim } from '@phosphor-icons/react';
import { Layout, Menu } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useApp } from '../../store/app';

const { Sider, Header, Content } = Layout;

/** 后台布局：左侧菜单 + 顶栏 + 内容 */
export default function AdminLayout() {
  const { logoutAdmin, theme, toggleTheme } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const selected = location.pathname.startsWith('/admin/districts') ? 'districts' : 'pois';

  return (
    <Layout className="admin">
      <Sider breakpoint="lg" collapsedWidth={0} width={220} theme="light" className="admin-sider">
        <Link to="/admin/pois" className="brand admin-brand">
          <span className="brand-mark"><Path size={18} weight="bold" /></span>悠行后台
        </Link>
        <Menu mode="inline" selectedKeys={[selected]} onClick={({ key }) => navigate(`/admin/${key}`)}
          items={[
            { key: 'pois', icon: <MapTrifold size={18} />, label: '景点管理' },
            { key: 'districts', icon: <MapPinArea size={18} />, label: '片区管理' },
          ]} />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <span className="admin-user">管理员</span>
          <Link to="/" className="icon-btn" aria-label="回到网站首页" title="回到网站首页"><House size={20} /></Link>
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="切换深浅色">
            {theme === 'dark' ? <SunDim size={20} /> : <MoonStars size={20} />}
          </button>
          <button type="button" className="btn is-secondary is-small" onClick={() => {
            logoutAdmin();
            navigate('/admin/login', { replace: true });
          }}>
            <SignOut size={16} />退出
          </button>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
