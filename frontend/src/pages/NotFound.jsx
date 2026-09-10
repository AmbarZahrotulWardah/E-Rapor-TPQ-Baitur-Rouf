import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { REDIRECT_PER_ROLE } from '../utils/constants';

/** Halaman 404. */
const NotFound = () => {
  const { sudahLogin, user } = useAuth();
  const tujuan = sudahLogin ? REDIRECT_PER_ROLE[user?.role] || '/' : '/login';

  return (
    <div className="halaman-login">
      <div className="kartu teks-tengah" style={{ maxWidth: 460 }}>
        <div style={{ fontSize: '3rem' }}>🧭</div>
        <h1>Halaman Tidak Ditemukan</h1>
        <p className="teks-abu">
          Alamat yang Anda tuju tidak tersedia pada sistem E-Rapor TPQ Baitur Rouf.
        </p>
        <Link to={tujuan} className="btn">Kembali ke Beranda</Link>
      </div>
    </div>
  );
};

export default NotFound;
