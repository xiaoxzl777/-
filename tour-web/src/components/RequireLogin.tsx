import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useApp } from '../store/app';

/** 需要游客登录的页面 */
export function RequireUser({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
      state={location.state} replace />;
  }
  return children;
}

/** 需要管理员登录的页面 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { adminToken } = useApp();
  if (!adminToken) return <Navigate to="/admin/login" replace />;
  return children;
}
