import { useEffect, useState } from 'react';
import dashboardApi from '../../api/dashboardApi';
import nilaiApi from '../../api/nilaiApi';
import { pesanGalat } from '../../api/axiosInstance';
import { GrafikGaris, GrafikGabungan, GrafikBatangKriteria, GrafikRadar } from '../../components/grafik/GrafikPerkembangan';

/** FR-6 — Grafik perkembangan nilai anak, dapat difilter per kelompok kriteria. */
const GrafikSantri = () => {
  const [anak, setAnak] = useState([]);
  const [idDipilih, setIdDipilih] = useState(null);
  const [periodeList, setPeriodeList] = useState([]);
  const [periode, setPeriode] = useState('');
  const [jenis, setJenis] = useState('semua');
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
    nilaiApi
      .daftarPeriode()
      .then((res) => {
        setPeriodeList(res.data.data);
        if (!periode && res.data.data.length) setPeriode(res.data.data[0].periode);
      })
      .catch(() => {});
  }, [idDipilih, periode]);

  useEffect(() => {
    if (!idDipilih) return;
    setData(null);
    nilaiApi
      .perkembangan(idDipilih, { periode: periode || undefined, jenis })
      .then((res) => setData(res.data.data))
      .catch((e) => setGalat(pesanGalat(e)));
  }, [idDipilih, periode, jenis]);

  if (memuat) return <div className="pemuat">Memuat data...</div>;
  if (galat) return <div className="alert alert-galat">{galat}</div>;

  if (!anak.length) {
    return (
      <div className="kartu">
        <div className="kosong">Belum ada data santri yang ditautkan ke akun Anda.</div>
      </div>
    );
  }

  return (
    <>
      <div className="kartu">
        <div className="kartu-judul">
          <div>
            <h3>Grafik Perkembangan Nilai</h3>
            <span className="sub">Pantau tren belajar anak dari waktu ke waktu</span>
          </div>
        </div>

        <div className="form-grid">
          {anak.length > 1 ? (
            <div className="form-item">
              <label>Anak</label>
              <select value={idDipilih} onChange={(e) => setIdDipilih(e.target.value)}>
                {anak.map((a) => (
                  <option key={a.id} value={a.id}>{a.nama}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="form-item">
            <label>Periode</label>
            <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
              <option value="">Semua periode</option>
              {periodeList.map((p) => (
                <option key={p.periode} value={p.periode}>{p.periode}</option>
              ))}
            </select>
          </div>

          <div className="form-item">
            <label>Kelompok Kriteria</label>
            <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
              <option value="semua">Semua kriteria</option>
              <option value="tajwid">Tajwid saja</option>
              <option value="akademik">Akademik saja</option>
            </select>
            <span className="bantuan">Memisahkan capaian tajwid dan akademik (FR-6).</span>
          </div>
        </div>
      </div>

      {!data ? (
        <div className="pemuat">Memuat grafik...</div>
      ) : (
        <>
          <div className="kartu">
            <div className="kartu-judul">
              <h3>Tren Nilai per Pertemuan per Kriteria</h3>
              <span className="sub">{data.detailPerKriteria.length} titik data</span>
            </div>
            <GrafikGaris data={data} judul="" />
          </div>

          <div className="grid grid-2">
            <div className="kartu">
              <div className="kartu-judul"><h3>Rata-rata Seluruh Kriteria</h3></div>
              <GrafikGabungan garis={data.garisGabungan} judul="" />
            </div>

            <div className="kartu">
              <div className="kartu-judul"><h3>Perbandingan Antar Kriteria</h3></div>
              <GrafikBatangKriteria perKriteria={data.perKriteria} />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="kartu">
              <div className="kartu-judul"><h3>Profil Capaian (Radar)</h3></div>
              <GrafikRadar perKriteria={data.perKriteria} />
            </div>

            <div className="kartu">
              <div className="kartu-judul"><h3>Rincian Nilai per Kriteria</h3></div>
              <div className="tabel-wrap">
                <table className="tabel">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Kriteria</th>
                      <th className="tengah">Kelompok</th>
                      <th className="tengah">Rata-rata</th>
                      <th className="tengah">Capaian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perKriteria.map((k) => (
                      <tr key={k.kode}>
                        <td className="mono">{k.kode}</td>
                        <td>{k.nama}</td>
                        <td className="tengah">
                          <span className={k.kode === 'C5' ? 'badge badge-biru' : 'badge badge-hijau'}>
                            {k.kode === 'C5' ? 'akademik' : 'tajwid'}
                          </span>
                        </td>
                        <td className="tengah mono">{k.skor.toFixed(2)}</td>
                        <td>
                          <div className="bilah-nilai">
                            <div className="isi" style={{ width: `${k.skor}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!data.perKriteria.length ? (
                      <tr><td colSpan={5} className="kosong">Belum ada data nilai.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GrafikSantri;
