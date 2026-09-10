import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import dashboardApi from '../../api/dashboardApi';
import { pesanGalat } from '../../api/axiosInstance';
import { RENTANG_PREDIKAT, PALET_GRAFIK } from '../../utils/constants';

/** Dashboard Admin — ringkasan data dan distribusi predikat hasil SAW. */
const DashboardAdmin = () => {
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState('');

  useEffect(() => {
    dashboardApi
      .admin()
      .then((res) => setData(res.data.data))
      .catch((e) => setGalat(pesanGalat(e)))
      .finally(() => setMemuat(false));
  }, []);

  if (memuat) return <div className="pemuat">Memuat data dashboard...</div>;
  if (galat) return <div className="alert alert-galat">{galat}</div>;

  const { ringkasan, distribusiPredikat, santriPerKelas } = data;

  const kartu = [
    { label: 'Total Santri', angka: ringkasan.jumlahSantri, catatan: 'Santri terdaftar' },
    { label: 'Kelas', angka: ringkasan.jumlahKelas, catatan: 'Rombongan belajar' },
    { label: 'Ustadz/Ustadzah', angka: ringkasan.jumlahUstadz, catatan: `${ringkasan.jumlahWali} akun wali` },
    { label: 'Data Nilai', angka: ringkasan.jumlahNilai, catatan: `${ringkasan.jumlahHasilSaw} hasil SAW` },
  ];

  const warnaPredikat = (nama) => RENTANG_PREDIKAT.find((r) => r.predikat === nama)?.warna || '#9ca3af';

  return (
    <>
      <div className="grid grid-4 mb-2">
        {kartu.map((k) => (
          <div className="statistik" key={k.label}>
            <div className="label">{k.label}</div>
            <div className="angka">{k.angka}</div>
            <div className="catatan">{k.catatan}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="kartu">
          <div className="kartu-judul">
            <h3>Distribusi Predikat Santri</h3>
            <span className="sub">Hasil perhitungan SAW</span>
          </div>
          {distribusiPredikat.length ? (
            <div style={{ height: 260 }}>
              <Doughnut
                data={{
                  labels: distribusiPredikat.map((d) => d.predikat),
                  datasets: [
                    {
                      data: distribusiPredikat.map((d) => d.jumlah),
                      backgroundColor: distribusiPredikat.map((d) => warnaPredikat(d.predikat)),
                      borderWidth: 2,
                      borderColor: '#fff',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
                }}
              />
            </div>
          ) : (
            <div className="kosong">Belum ada hasil perhitungan SAW.</div>
          )}
        </div>

        <div className="kartu">
          <div className="kartu-judul">
            <h3>Jumlah Santri per Kelas</h3>
          </div>
          {santriPerKelas.length ? (
            <div style={{ height: 260 }}>
              <Bar
                data={{
                  labels: santriPerKelas.map((k) => k.kelas),
                  datasets: [
                    {
                      label: 'Jumlah santri',
                      data: santriPerKelas.map((k) => k.jumlah),
                      backgroundColor: PALET_GRAFIK[0],
                      borderRadius: 5,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                }}
              />
            </div>
          ) : (
            <div className="kosong">Belum ada data kelas.</div>
          )}
        </div>
      </div>

      <div className="kartu">
        <div className="kartu-judul">
          <h3>Rekap Predikat</h3>
          <span className="sub">Rentang nilai preferensi Vi</span>
        </div>
        <div className="tabel-wrap">
          <table className="tabel">
            <thead>
              <tr>
                <th>Predikat</th>
                <th className="tengah">Rentang Vi</th>
                <th className="tengah">Jumlah Santri</th>
                <th className="tengah">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {RENTANG_PREDIKAT.map((r) => {
                const jumlah = distribusiPredikat.find((d) => d.predikat === r.predikat)?.jumlah || 0;
                const total = distribusiPredikat.reduce((a, d) => a + d.jumlah, 0);
                return (
                  <tr key={r.predikat}>
                    <td>
                      <span className="badge" style={{ background: `${r.warna}22`, color: r.warna }}>{r.predikat}</span>
                    </td>
                    <td className="tengah mono">
                      {r.min === 0 ? `< 0.55` : r.min === 0.85 ? '≥ 0.85' : `${r.min} – ${(RENTANG_PREDIKAT[RENTANG_PREDIKAT.indexOf(r) - 1]?.min ?? 1).toFixed(2)}`}
                    </td>
                    <td className="tengah">{jumlah}</td>
                    <td className="tengah">{total ? `${((jumlah / total) * 100).toFixed(1)}%` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DashboardAdmin;
