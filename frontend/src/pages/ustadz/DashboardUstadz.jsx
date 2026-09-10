import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dashboardApi from '../../api/dashboardApi';
import { pesanGalat } from '../../api/axiosInstance';

/** Dashboard Ustadz — kelas yang diampu dan progres input nilai. */
const DashboardUstadz = () => {
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState('');

  useEffect(() => {
    dashboardApi
      .ustadz()
      .then((res) => setData(res.data.data))
      .catch((e) => setGalat(pesanGalat(e)))
      .finally(() => setMemuat(false));
  }, []);

  if (memuat) return <div className="pemuat">Memuat data dashboard...</div>;
  if (galat) return <div className="alert alert-galat">{galat}</div>;

  return (
    <>
      <div className="grid grid-3 mb-2">
        <div className="statistik">
          <div className="label">Kelas Diampu</div>
          <div className="angka">{data.kelas.length}</div>
          <div className="catatan">Rombongan belajar</div>
        </div>
        <div className="statistik">
          <div className="label">Total Santri</div>
          <div className="angka">{data.totalSantri}</div>
          <div className="catatan">Seluruh kelas</div>
        </div>
        <div className="statistik">
          <div className="label">Nilai Terinput</div>
          <div className="angka">{data.totalNilaiDiinput}</div>
          <div className="catatan">Periode berjalan</div>
        </div>
      </div>

      <div className="kartu">
        <div className="kartu-judul">
          <div>
            <h3>Kelas dan Progres Input Nilai</h3>
            <span className="sub">Klik nama kelas untuk membuka form input nilai</span>
          </div>
          <Link to="/ustadz/nilai" className="btn btn-kecil">+ Input Nilai</Link>
        </div>

        <div className="tabel-wrap">
          <table className="tabel">
            <thead>
              <tr>
                <th>Nama Kelas</th>
                <th className="tengah">Jumlah Santri</th>
                <th className="tengah">Nilai Terinput</th>
                <th className="tengah">Rata-rata per Santri</th>
                <th className="tengah">Status</th>
                <th className="kanan">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.kelas.map((k) => {
                const rata = k.jumlahSantri ? (k.totalNilaiDiinput / k.jumlahSantri).toFixed(1) : 0;
                return (
                  <tr key={k.id}>
                    <td className="teks-tebal">
                      {k.namaKelas}
                      {!k.diampuSendiri ? <span className="badge badge-abu" style={{ marginLeft: 6 }}>kelas lain</span> : null}
                    </td>
                    <td className="tengah">{k.jumlahSantri}</td>
                    <td className="tengah">{k.totalNilaiDiinput}</td>
                    <td className="tengah mono">{rata}</td>
                    <td className="tengah">
                      <span className={k.totalNilaiDiinput > 0 ? 'badge badge-hijau' : 'badge badge-kuning'}>
                        {k.totalNilaiDiinput > 0 ? 'Sudah ada nilai' : 'Belum ada nilai'}
                      </span>
                    </td>
                    <td className="kanan">
                      <Link to={`/ustadz/nilai?kelas=${k.id}`} className="btn btn-sekunder btn-kecil">Input Nilai</Link>
                    </td>
                  </tr>
                );
              })}
              {!data.kelas.length ? <tr><td colSpan={6} className="kosong">Belum ada kelas.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {data.daftarPeriode?.length ? (
        <div className="kartu">
          <div className="kartu-judul"><h3>Periode Penilaian Tersedia</h3></div>
          <div className="btn-grup">
            {data.daftarPeriode.map((p) => (
              <Link key={p} to={`/ustadz/peringkat?periode=${encodeURIComponent(p)}`} className="btn btn-sekunder btn-kecil">
                {p}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DashboardUstadz;
