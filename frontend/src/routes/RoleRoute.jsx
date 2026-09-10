import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { REDIRECT_PER_ROLE } from '../utils/constants';

/**
 * FR-1 (RBAC) — membatasi rute hanya untuk role tertentu.
 * Pengguna dengan role lain dialihkan ke dashboard miliknya sendiri,
 * bukan ke halaman login, karena ia sebenarnya sudah terautentikasi.
 */
const RoleRoute = ({ roles, children }) => {
  const { user, sudahLogin } = useAuth();

  if (!sudahLogin) return <Navigate to="/login" replace />;
  if (!roles.includes(user?.role)) {
    return <Navigate to={REDIRECT_PER_ROLE[user?.role] || '/login'} replace />;
  }
  return children;
};

export default RoleRoute;
