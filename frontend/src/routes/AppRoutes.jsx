import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';
import Layout from '../components/Layout';
import { ROLES, REDIRECT_PER_ROLE } from '../utils/constants';
import useAuth from '../hooks/useAuth';

import Login from '../pages/auth/Login';
import NotFound from '../pages/NotFound';

import DashboardAdmin from '../pages/admin/DashboardAdmin';
import KelolaUser from '../pages/admin/KelolaUser';
import KelolaKriteria from '../pages/admin/KelolaKriteria';

import DashboardUstadz from '../pages/ustadz/DashboardUstadz';
import DataSantri from '../pages/ustadz/DataSantri';
import InputNilai from '../pages/ustadz/InputNilai';
import PeringkatSAW from '../pages/ustadz/PeringkatSAW';

import DashboardWali from '../pages/walisantri/DashboardWali';
import GrafikSantri from '../pages/walisantri/GrafikSantri';
import RaporSantri from '../pages/walisantri/RaporSantri';

/** Halaman yang hanya boleh dibuka oleh pengguna yang BELUM login. */
const HanyaTamu = ({ children }) => {
  const { sudahLogin, user } = useAuth();
  if (sudahLogin) return <Navigate to={REDIRECT_PER_ROLE[user?.role] || '/'} replace />;
  return children;
};

const bungkus = (children) => <Layout>{children}</Layout>;

/**
 * Peta rute aplikasi.
 * Pengelompokan mengikuti Vault/flow.md §1 (redirect per role).
 */
const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<HanyaTamu><Login /></HanyaTamu>} />

    {/* ------------------------------- Admin ------------------------------- */}
    <Route
      path="/admin/dashboard"
      element={<PrivateRoute><RoleRoute roles={[ROLES.ADMIN]}>{bungkus(<DashboardAdmin />)}</RoleRoute></PrivateRoute>}
    />
    <Route
      path="/admin/pengguna"
      element={<PrivateRoute><RoleRoute roles={[ROLES.ADMIN]}>{bungkus(<KelolaUser />)}</RoleRoute></PrivateRoute>}
    />
    <Route
      path="/admin/kriteria"
      element={<PrivateRoute><RoleRoute roles={[ROLES.ADMIN]}>{bungkus(<KelolaKriteria />)}</RoleRoute></PrivateRoute>}
    />

    {/* ------------------------ Ustadz (juga Admin) ------------------------ */}
    <Route
      path="/ustadz/dashboard"
      element={<PrivateRoute><RoleRoute roles={[ROLES.USTADZ, ROLES.ADMIN]}>{bungkus(<DashboardUstadz />)}</RoleRoute></PrivateRoute>}
    />
    <Route
      path="/ustadz/santri"
      element={<PrivateRoute><RoleRoute roles={[ROLES.USTADZ, ROLES.ADMIN]}>{bungkus(<DataSantri />)}</RoleRoute></PrivateRoute>}
    />
    <Route
      path="/ustadz/nilai"
      element={<PrivateRoute><RoleRoute roles={[ROLES.USTADZ, ROLES.ADMIN]}>{bungkus(<InputNilai />)}</RoleRoute></PrivateRoute>}
    />
    <Route
      path="/ustadz/peringkat"
      element={<PrivateRoute><RoleRoute roles={[ROLES.USTADZ, ROLES.ADMIN]}>{bungkus(<PeringkatSAW />)}</RoleRoute></PrivateRoute>}
    />

    {/* --------------------------- Wali Santri ---------------------------- */}
    <Route
      path="/wali/dashboard"
      element={<PrivateRoute><RoleRoute roles={[ROLES.WALI_SANTRI]}>{bungkus(<DashboardWali />)}</RoleRoute></PrivateRoute>}
    />
    <Route
      path="/wali/grafik"
      element={<PrivateRoute><RoleRoute roles={[ROLES.WALI_SANTRI]}>{bungkus(<GrafikSantri />)}</RoleRoute></PrivateRoute>}
    />
    <Route
      path="/wali/rapor"
      element={<PrivateRoute><RoleRoute roles={[ROLES.WALI_SANTRI]}>{bungkus(<RaporSantri />)}</RoleRoute></PrivateRoute>}
    />

    {/* ------------------------------ Lainnya ----------------------------- */}
    <Route path="/" element={<ArahkanAwal />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

/** Arahkan pengguna ke dashboard sesuai role-nya. */
const ArahkanAwal = () => {
  const { sudahLogin, user } = useAuth();
  if (!sudahLogin) return <Navigate to="/login" replace />;
  return <Navigate to={REDIRECT_PER_ROLE[user?.role] || '/login'} replace />;
};

export default AppRoutes;
