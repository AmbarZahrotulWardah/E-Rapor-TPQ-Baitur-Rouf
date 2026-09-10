import { NavLink, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROLES, LABEL_ROLE } from '../utils/constants';

/** Susunan menu samping untuk tiap role. */
const MENU = {
  [ROLES.ADMIN]: [
    { label: 'Umum', item: [{ ke: '/admin/dashboard', ikon: '📊', teks: 'Dashboard' }] },
    {
      label: 'Data Master',
      item: [
        { ke: '/admin/pengguna', ikon: '👥', teks: 'Kelola Pengguna' },
        { ke: '/admin/kriteria', ikon: '⚖️', teks: 'Kriteria & Bobot SAW' },
      ],
    },
    {
      label: 'Penilaian',
      item: [
        { ke: '/ustadz/santri', ikon: '🧒', teks: 'Data Santri' },
        { ke: '/ustadz/nilai', ikon: '✏️', teks: 'Input Nilai' },
        { ke: '/ustadz/peringkat', ikon: '🏅', teks: 'Perhitungan SAW' },
      ],
    },
  ],
  [ROLES.USTADZ]: [
    { label: 'Umum', item: [{ ke: '/ustadz/dashboard', ikon: '📊', teks: 'Dashboard' }] },
    {
      label: 'Penilaian',
      item: [
        { ke: '/ustadz/santri', ikon: '🧒', teks: 'Data Santri' },
        { ke: '/ustadz/nilai', ikon: '✏️', teks: 'Input Nilai' },
        { ke: '/ustadz/peringkat', ikon: '🏅', teks: 'Perhitungan SAW' },
      ],
    },
  ],
  [ROLES.WALI_SANTRI]: [
    {
      label: 'Rapor Anak',
      item: [
        { ke: '/wali/dashboard', ikon: '📊', teks: 'Dashboard' },
        { ke: '/wali/grafik', ikon: '📈', teks: 'Grafik Perkembangan' },
        { ke: '/wali/rapor', ikon: '📄', teks: 'Rapor & Unduh PDF' },
      ],
    },
  ],
};

const JUDUL_HALAMAN = {
  '/admin/dashboard': ['Dashboard Admin', 'Ringkasan data TPQ dan distribusi predikat santri'],
  '/admin/pengguna': ['Kelola Pengguna', 'Tambah dan atur akun admin, ustadz, dan wali santri'],
  '/admin/kriteria': ['Kriteria & Bobot SAW', 'Konfigurasi kriteria penilaian dan bobot metode SAW'],
  '/ustadz/dashboard': ['Dashboard Ustadz', 'Kelas yang Anda ampu dan progres input nilai'],
  '/ustadz/santri': ['Data Santri', 'Kelola data pribadi dan penempatan kelas santri'],
  '/ustadz/nilai': ['Input Nilai', 'Isi skor tajwid dan akademik per kriteria per pertemuan'],
  '/ustadz/peringkat': ['Perhitungan SAW', 'Jalankan perhitungan SAW dan lihat peringkat santri'],
  '/wali/dashboard': ['Dashboard Wali Santri', 'Pantau perkembangan belajar anak Anda'],
  '/wali/grafik': ['Grafik Perkembangan', 'Tren nilai anak per pertemuan dan per kriteria'],
  '/wali/rapor': ['Rapor Santri', 'Lihat dan unduh rapor anak dalam bentuk PDF'],
};

/** Kerangka halaman bertema untuk pengguna yang sudah login. */
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const lokasi = useLocation();
  const menu = MENU[user?.role] || [];
  const [judul, keterangan] = JUDUL_HALAMAN[lokasi.pathname] || ['E-Rapor TPQ Baitur Rouf', ''];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="judul">📖 E-Rapor TPQ</div>
          <div className="subjudul">Baitur Rouf Surabaya</div>
        </div>

        {menu.map((grup) => (
          <div key={grup.label}>
            <div className="sidebar-label">{grup.label}</div>
            {grup.item.map((m) => (
              <NavLink
                key={m.ke}
                to={m.ke}
                className={({ isActive }) => `sidebar-link${isActive ? ' aktif' : ''}`}
              >
                <span className="ikon">{m.ikon}</span>
                <span>{m.teks}</span>
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="nama">{user?.nama}</div>
            <div className="peran">{LABEL_ROLE[user?.role] || user?.role}</div>
          </div>
          <button type="button" className="btn btn-sekunder btn-kecil btn-blok" onClick={logout}>
            Keluar
          </button>
        </div>
      </aside>

      <div className="konten">
        <header className="topbar">
          <div>
            <div className="judul-halaman">{judul}</div>
            {keterangan ? <div className="keterangan">{keterangan}</div> : null}
          </div>
          <div className="teks-kecil teks-abu">Metode SAW · TPQ Baitur Rouf</div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
