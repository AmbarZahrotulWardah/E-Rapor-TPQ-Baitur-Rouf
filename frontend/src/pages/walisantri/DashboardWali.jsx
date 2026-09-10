import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dashboardApi from '../../api/dashboardApi';
import { pesanGalat } from '../../api/axiosInstance';
import { formatTanggal, hitungUmur, keSkala100 } from '../../utils/formatDate';
import { kelasBadgePredikat, warnaPredikat } from '../../utils/predikatHelper';
import { GrafikGabungan, GrafikBatangKriteria } from '../../components/grafik/GrafikPerkembangan';

/** FR-5 — Dashboard Wali Santri (data terbatas pada anak sendiri). */
const DashboardWali = () => {
  const [anak, setAnak] = useState([]);
  const [idDipilih, setIdDipilih] = useState(null);
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState('');

  useEffect(() => {
    dashboardApi
      .anakSaya()
      .then((res) => {
        const daftar = res.data.data;
        setAnak(daftar);
        if (daftar.length) setIdDipilih(daftar[0].id);
      })
      .catch((e) => setGalat(pesanGalat(e)))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(() => {
    if (!idDipilih) return;
    setData(null);
    dashboardApi
      .wali(idDipilih)
      .then((res) => setData(res.data.data))
      .catch((e) => setGalat(pesanGalat(e)));
  }, [idDipilih]);

  if (memuat) return <div className="pemuat">Memuat data...</div>;
  if (galat) return <div className="alert alert-galat">{galat}</div>;

  if (!anak.length) {
    return (
      <div className="kartu">
        <div className="kosong">
          Belum ada data santri yang ditautkan ke akun Anda.
          Silakan hubungi admin TPQ Baitur Rouf.
        </div>
      </div>
    );
  }

  return (
    <>
      {anak.length > 1 ? (
        <div className="kartu">
          <div className="kartu-judul">
            <div>
              <h3>Pilih Anak</h3>
              <span className="sub">Akun Anda memiliki {anak.length} anak terdaftar</span>
            </div>
          </div>
          <div className="btn-grup">
            {anak.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`btn ${a.id === idDipilih ? '' : 'btn-sekunder'}`}
                onClick={() => setIdDipilih(a.id)}
              >
                {a.nama}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!data ? (
        <div className="pemuat">Memuat rapor...</div>
      ) : (
        <>
          <div className="kartu">
            <div className="flex-antara flex-bungkus">
              <div>
                <h2 className="mb-0">{data.santri.nama}</h2>
                <div className="teks-kecil teks-abu">
                  NIS {data.santri.nis} · Kelas {data.santri.kelas} ·{' '}
                  {data.santri.tanggalLahir
                    ? `${formatTanggal(data.santri.tanggalLahir)} (${hitungUmur(data.santri.tanggalLahir)})`
                    : '-'}
                </div>
              </div>
              <div className="btn-grup">
                <Link to="/wali/grafik" className="btn btn-sekunder btn-kecil">Lihat Grafik</Link>
                <Link to="/wali/rapor" className="btn btn-kecil">Unduh Rapor PDF</Link>
              </div>
            </div>
          </div>

          {data.hasilTerbaru ? (
            <>
              <div className="grid grid-4 mb-2">
                <div className="statistik">
                  <div className="label">Nilai Akhir (Vi)</div>
                  <div className="angka">{data.hasilTerbaru.nilaiAkhir.toFixed(4)}</div>
                  <div className="catatan">Hasil metode SAW</div>
                </div>
                <div className="statistik">
                  <div className="label">Skala 0-100</div>
                  <div className="angka">{data.hasilTerbaru.nilaiSkala100}</div>
                  <div className="catatan">Konversi nilai</div>
                </div>
                <div className="statistik" style={{ borderLeftColor: warnaPredikat(data.hasilTerbaru.predikat) }}>
                  <div className="label">Predikat</div>
                  <div className="angka" style={{ fontSize: '1.3rem', color: warnaPredikat(data.hasilTerbaru.predikat) }}>
                    {data.hasilTerbaru.predikat}
                  </div>
                  <div className="catatan">Periode {data.hasilTerbaru.periode}</div>
                </div>
                <div className="statistik">
                  <div className="label">Periode Dinilai</div>
                  <div className="angka" style={{ fontSize: '1.1rem' }}>{data.riwayatPeriode.length}</div>
                  <div className="catatan">Riwayat penilaian</div>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="kartu">
                  <div className="kartu-judul">
                    <h3>Tren Nilai per Pertemuan</h3>
                    <span className="sub">{data.hasilTerbaru.periode}</span>
                  </div>
                  <GrafikGabungan garis={data.perkembangan?.garisGabungan || []} judul="" />
                </div>

                <div className="kartu">
                  <div className="kartu-judul">
                    <h3>Capaian per Kriteria</h3>
                    <span className="sub">Rata-rata skor</span>
                  </div>
                  <GrafikBatangKriteria perKriteria={data.perkembangan?.perKriteria || []} />
                </div>
              </div>

              <div className="kartu">
                <div className="kartu-judul">
                  <div>
                    <h3>Riwayat Penilaian</h3>
                    <span className="sub">Perkembangan nilai akhir antar periode</span>
                  </div>
                </div>
                <div className="tabel-wrap">
                  <table className="tabel">
                    <thead>
                      <tr>
                        <th>Periode</th>
                        <th className="tengah">Nilai Akhir (Vi)</th>
                        <th className="tengah">Skala 100</th>
                        <th className="tengah">Predikat</th>
                        <th className="tengah">Visualisasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.riwayatPeriode.map((r) => (
                        <tr key={`${r.periode}-${r.basisNormalisasi}`}>
                          <td className="teks-tebal">{r.periode}</td>
                          <td className="tengah mono">{r.nilaiAkhir.toFixed(4)}</td>
                          <td className="tengah mono">{keSkala100(r.nilaiAkhir)}</td>
                          <td className="tengah">
                            <span className={kelasBadgePredikat(r.predikat)}>{r.predikat}</span>
                          </td>
                          <td>
                            <div className="bilah-nilai">
                              <div
                                className="isi"
                                style={{
                                  width: `${Math.min(100, Number(keSkala100(r.nilaiAkhir)))}%`,
                                  background: warnaPredikat(r.predikat),
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!data.riwayatPeriode.length ? (
                        <tr><td colSpan={5} className="kosong">Belum ada hasil perhitungan SAW.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="kartu">
              <div className="alert alert-info mb-0">
                Perhitungan nilai untuk <strong>{data.santri.nama}</strong> belum dijalankan.
                Hasil akan tampil setelah ustadz menghitung penilaian pada periode berjalan.
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default DashboardWali;
