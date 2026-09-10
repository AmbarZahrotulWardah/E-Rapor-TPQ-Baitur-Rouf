import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * FR-1 — melindungi rute yang memerlukan login.
 * Pengguna yang belum login diarahkan ke halaman login, dan alamat asal
 * disimpan agar dapat dikembalikan setelah login berhasil.
 */
const PrivateRoute = ({ children }) => {
  const { sudahLogin } = useAuth();
  const lokasi = useLocation();

  if (!sudahLogin) {
    return <Navigate to="/login" replace state={{ dari: lokasi.pathname }} />;
  }
  return children;
};

export default PrivateRoute;
