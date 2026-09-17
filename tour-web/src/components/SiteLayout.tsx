import { List, MoonStars, Path, SignOut, SunDim } from '@phosphor-icons/react';
import { Drawer, Dropdown } from 'antd';
import { useRef, useState, type MouseEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useApp } from '../store/app';

const LINKS = [
  { to: '/', label: '首页', end: true },
  { to: '/pois', label: '景点' },
  { to: '/chat', label: '问小萧' },
  { to: '/trips', label: '我的行程' },
];

/** 游客端布局：顶部导航 + 页面内容 + 页脚 */
export default function SiteLayout() {
  const { user, logoutUser, theme, toggleTheme } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const lineRef = useRef<HTMLSpanElement>(null);
  const isChat = location.pathname.startsWith('/chat');

  // 导航下划线跟着鼠标移动
  const moveLine = (event: MouseEvent<HTMLAnchorElement>) => {
    const line = lineRef.current;
    const link = event.currentTarget;
    if (!line) return;
    line.style.opacity = '1';
    line.style.transform = `translateX(${link.offsetLeft + 14}px) scaleX(${(link.offsetWidth - 28) / 100})`;
  };
  const hideLine = () => {
    if (lineRef.current) lineRef.current.style.opacity = '0';
  };

  return (
    <div className={`site ${isChat ? 'is-app' : ''}`}>
      <header className="nav">
        <Link to="/" className="brand" aria-label="悠行首页">
          <span className="brand-mark"><Path size={20} weight="bold" className="ic" /></span>
          悠行
        </Link>
        <nav className="nav-links" aria-label="主导航" onMouseLeave={hideLine}>
          {LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} onMouseEnter={moveLine}>
              {link.label}
            </NavLink>
          ))}
          <span className="nav-line" ref={lineRef} aria-hidden="true" />
        </nav>
        <div className="nav-end">
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? '切换到浅色' : '切换到深色'}>
            {theme === 'dark' ? <SunDim size={20} /> : <MoonStars size={20} />}
          </button>
          {user ? (
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'trips', label: '我的行程' },
                  { type: 'divider' },
                  { key: 'logout', label: '退出登录', icon: <SignOut size={16} /> },
                ],
                onClick: ({ key }) => {
                  if (key === 'trips') navigate('/trips');
                  if (key === 'logout') {
                    logoutUser();
                    navigate('/');
                  }
                },
              }}
            >
              <button type="button" className="avatar" aria-label={`${user.nickname}，打开菜单`}>
                {user.nickname.slice(0, 1)}
              </button>
            </Dropdown>
          ) : (
            <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="btn is-small is-secondary nav-login">
              登录
            </Link>
          )}
          <button type="button" className="icon-btn nav-menu" onClick={() => setMenuOpen(true)} aria-label="打开菜单">
            <List size={22} />
          </button>
        </div>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} placement="right" size={260} title="悠行">
        <nav className="drawer-links">
          {LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMenuOpen(false)}>{link.label}</NavLink>
          ))}
        </nav>
      </Drawer>

      <main className="site-main">
        <Outlet />
      </main>

      {!isChat && (
        <footer className="footer">
          <div className="wrap">
            <Link to="/" className="brand is-small">
              <span className="brand-mark"><Path size={16} weight="bold" className="ic" /></span>悠行
            </Link>
            <p>广州一日游行程规划 · 毕业设计作品。开放时间和票价以景点官网为准。</p>
            <nav>
              <Link to="/pois">景点</Link>
              <Link to="/chat">问小萧</Link>
              <Link to="/admin">后台管理</Link>
            </nav>
          </div>
        </footer>
      )}
    </div>
  );
}
