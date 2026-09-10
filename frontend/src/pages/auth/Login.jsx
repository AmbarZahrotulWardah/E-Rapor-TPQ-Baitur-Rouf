import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { pesanGalat } from '../../api/axiosInstance';
import { LABEL_ROLE } from '../../utils/constants';

const AKUN_UJI = [
  { peran: 'Admin', email: 'admin@tpqbaiturrouf.sch.id', password: 'admin123' },
  { peran: 'Ustadz', email: 'ustadz1@tpqbaiturrouf.sch.id', password: 'ustadz123' },
  { peran: 'Wali Santri', email: 'wali1@tpqbaiturrouf.sch.id', password: 'wali123' },
];

/** FR-1 — satu halaman login untuk seluruh role. */
const Login = () => {
  const { login, memuat, sudahLogin, user } = useAuth();
  const navigate = useNavigate();
  const lokasi = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [galat, setGalat] = useState('');
  const [lihatPassword, setLihatPassword] = useState(false);

  if (sudahLogin) return <Navigate to={lokasi.state?.dari || '/'} replace />;

  const kirim = async (e) => {
    e.preventDefault();
    setGalat('');
    try {
      const hasil = await login(email, password);
      navigate(hasil.redirectTo || '/', { replace: true });
    } catch (error) {
      setGalat(pesanGalat(error));
    }
  };

  const isiCepat = (akun) => {
    setEmail(akun.email);
    setPassword(akun.password);
    setGalat('');
  };

  return (
    <div className="halaman-login">
      <div className="kotak-login">
        <div className="sisi-kiri">
          <h1>E-Rapor Digital TPQ Baitur Rouf</h1>
          <p>Sistem penilaian perkembangan tajwid dan akademik santri berbasis metode Simple Additive Weighting (SAW).</p>
          <div className="poin mt-2">✦ Nilai akhir dan predikat dihitung otomatis</div>
          <div className="poin">✦ Wali santri dapat memantau perkembangan anak</div>
          <div className="poin">✦ Rapor dapat diunduh dalam bentuk PDF</div>
        </div>

        <div className="sisi-kanan">
          <h2 className="mb-1">Masuk ke Sistem</h2>
          <p className="teks-kecil teks-abu mt-0 mb-2">
            Gunakan akun yang diberikan oleh admin TPQ.
          </p>

          {galat ? <div className="alert alert-galat">{galat}</div> : null}

          <form onSubmit={kirim}>
            <div className="form-item mb-1">
              <label htmlFor="email" className="wajib">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@tpqbaiturrouf.sch.id"
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="form-item mb-2">
              <label htmlFor="password" className="wajib">Password</label>
              <input
                id="password"
                type={lihatPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <label className="bantuan" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={lihatPassword}
                  onChange={(e) => setLihatPassword(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                Tampilkan password
              </label>
            </div>

            <button type="submit" className="btn btn-blok" disabled={memuat}>
              {memuat ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="daftar-akun-uji">
            <div className="teks-tebal mb-1">Akun contoh untuk pengujian</div>
            {AKUN_UJI.map((a) => (
              <div className="baris" key={a.email}>
                <span>{a.peran}</span>
                <span>
                  <code onClick={() => isiCepat(a)} title="Klik untuk mengisi form">{a.email}</code>
                </span>
              </div>
            ))}
            <div className="teks-abu mt-1">Klik alamat email untuk mengisi form secara otomatis.</div>
          </div>

          <p className="teks-kecil teks-abu mt-2 mb-0">
            Peran yang tersedia: {Object.values(LABEL_ROLE).join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
