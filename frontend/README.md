# Frontend — E-Rapor TPQ Baitur Rouf Surabaya

Antarmuka web berbasis **ReactJS** untuk Sistem E-Rapor Digital dengan metode **Simple Additive Weighting (SAW)**.

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Library UI | React 18 |
| Build tool | Vite 5 |
| Routing | React Router 6 |
| HTTP client | Axios |
| Grafik | Chart.js 4 + react-chartjs-2 |
| Styling | CSS murni (tanpa framework) agar ringan dan mudah disesuaikan |

## Menjalankan

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Perintah lain:

```bash
npm run build      # menghasilkan folder dist/
npm run preview    # pratinjau hasil build
```

> Backend Express harus berjalan lebih dahulu di port 5000 (`cd backend && npm start`).

## Konfigurasi Proxy

Frontend memanggil API melalui **jalur relatif** `/api/v1`, yang diteruskan Vite ke backend. Dengan demikian tidak ada alamat host yang di-*hardcode* di kode dan masalah CORS dapat dihindari — termasuk saat aplikasi dijalankan di lingkungan pratinjau ber-proxy.

```js
// vite.config.js
server: {
  host: '0.0.0.0',
  allowedHosts: true,
  proxy: { '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true } },
}
```

## Halaman per Role

| Role | Rute | Fungsi |
|------|------|--------|
| Semua | `/login` | Satu halaman login, diarahkan otomatis sesuai role (FR-1) |
| Admin | `/admin/dashboard` | Ringkasan data, distribusi predikat, jumlah santri per kelas |
| Admin | `/admin/pengguna` | Kelola akun admin, ustadz, dan wali santri |
| Admin | `/admin/kriteria` | Kelola kriteria & bobot SAW, validasi total bobot = 1 |
| Ustadz | `/ustadz/dashboard` | Kelas yang diampu dan progres input nilai |
| Ustadz | `/ustadz/santri` | Kelola data santri (FR-2) |
| Ustadz | `/ustadz/nilai` | Input nilai per kriteria per pertemuan, termasuk mode batch (FR-3) |
| Ustadz | `/ustadz/peringkat` | Jalankan perhitungan SAW dan lihat peringkat (FR-4) |
| Wali | `/wali/dashboard` | Kartu rapor anak, nilai akhir, predikat, grafik ringkas (FR-5) |
| Wali | `/wali/grafik` | Grafik tren per pertemuan, per kriteria, radar; filter tajwid/akademik (FR-6) |
| Wali | `/wali/rapor` | Pratinjau rapor dan unduhan PDF (FR-7) |

## Autentikasi & Proteksi Rute

- Token JWT disimpan di `localStorage` dan disisipkan otomatis ke setiap permintaan oleh *interceptor* axios.
- `PrivateRoute` melindungi rute yang memerlukan login.
- `RoleRoute` membatasi rute berdasarkan role; pengguna dengan role lain dialihkan ke dashboard miliknya.
- Respons 401 memicu penghapusan sesi dan pengalihan ke halaman login.

> Pembatasan di sisi antarmuka hanyalah lapisan kenyamanan. Penegakan hak akses yang sesungguhnya dilakukan backend melalui middleware RBAC dan pemeriksaan kepemilikan data.

## Struktur Folder

```
frontend/src/
├── api/                 # Pemanggil REST API (auth, santri, nilai, saw, rapor, dashboard)
├── components/
│   ├── grafik/          # Grafik garis, batang, radar (Chart.js)
│   ├── rapor/           # Pratinjau rapor
│   └── Layout.jsx       # Kerangka halaman + menu samping per role
├── context/             # AuthContext & AuthProvider
├── hooks/               # useAuth, useNilai, useSAW
├── pages/
│   ├── admin/           # DashboardAdmin, KelolaUser, KelolaKriteria
│   ├── ustadz/          # DashboardUstadz, DataSantri, InputNilai, PeringkatSAW
│   ├── walisantri/      # DashboardWali, GrafikSantri, RaporSantri
│   ├── auth/Login.jsx
│   └── NotFound.jsx
├── routes/              # AppRoutes, PrivateRoute, RoleRoute
├── styles/index.css     # Tema hijau TPQ, responsif
└── utils/               # constants, formatDate, predikatHelper, roleHelper
```

## Responsivitas

Tata letak menyesuaikan pada tiga titik:

- **> 980px** — menu samping tetap, grid 3–4 kolom.
- **760–980px** — grid menyempit menjadi 2 kolom, panel login bertumpuk.
- **< 760px** — menu samping berubah menjadi baris atas, seluruh grid menjadi satu kolom.

## Dokumentasi Terkait

`Vault/PRD.md` · `Vault/design.md` · `Vault/ai.md` · `Vault/flow.md` · `Vault/pengujian.md` · `Vault/history.md`
