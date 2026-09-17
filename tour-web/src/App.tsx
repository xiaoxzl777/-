import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { RequireAdmin, RequireUser } from './components/RequireLogin';
import SiteLayout from './components/SiteLayout';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminPois from './pages/admin/AdminPois';
import Districts from './pages/admin/Districts';
import PoiEdit from './pages/admin/PoiEdit';
import Chat from './pages/Chat';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import PoiDetail from './pages/PoiDetail';
import PoiList from './pages/PoiList';
import TripDetail from './pages/TripDetail';
import TripList from './pages/TripList';
import { useApp } from './store/app';
import { darkTheme, lightTheme } from './theme';

export default function App() {
  const { theme } = useApp();
  return (
    <ConfigProvider locale={zhCN} theme={theme === 'dark' ? darkTheme : lightTheme} button={{ autoInsertSpace: false }}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="pois" element={<PoiList />} />
              <Route path="pois/:id" element={<PoiDetail />} />
              <Route path="chat" element={<RequireUser><Chat /></RequireUser>} />
              <Route path="trips" element={<RequireUser><TripList /></RequireUser>} />
              <Route path="trips/:id" element={<RequireUser><TripDetail /></RequireUser>} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
              <Route index element={<Navigate to="pois" replace />} />
              <Route path="pois" element={<AdminPois />} />
              <Route path="pois/:id" element={<PoiEdit />} />
              <Route path="districts" element={<Districts />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
