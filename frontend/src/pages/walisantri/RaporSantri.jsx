import { useEffect, useState } from 'react';
import dashboardApi from '../../api/dashboardApi';
import raporApi from '../../api/raporApi';
import nilaiApi from '../../api/nilaiApi';
import { unduhPdfRapor } from '../../api/sawApi';
import { pesanGalat } from '../../api/axiosInstance';
import RaporPreview from '../../components/rapor/RaporPreview';

/** FR-7 — Pratinjau rapor dan unduhan PDF. */
const RaporSantri = () => {
  const [anak, setAnak] = useState([]);
  const [idDipilih, setIdDipilih] = useState(null);
  const [periodeList, setPeriodeList] = useState([]);
  const [periode, setPeriode] = useState('');
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [mengunduh, setMengunduh] = useState(false);
  const [galat, setGalat] = useState('');
  const [sukses, setSukses] = useState('');

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
    if (!idDipilih || !periode) {
      setData(null);
      return;
    }
    setData(null);
    raporApi
      .data(idDipilih, periode)
      .then((res) => setData(res.data.data))
      .catch((e) => setGalat(pesanGalat(e)));
  }, [idDipilih, periode]);

  const unduh = async () => {
    setMengunduh(true);
    setGalat('');
    setSukses('');
    try {
      const nama = await unduhPdfRapor(idDipilih, periode);
      setSukses(`Rapor berhasil diunduh: ${nama}`);
    } catch (e) {
      setGalat(`Gagal mengunduh PDF. ${pesanGalat(e)}`);
    } finally {
      setMengunduh(false);
    }
  };

  if (memuat) return <div className="pemuat">Memuat data...</div>;

  if (!anak.length) {
    return (
      <div className="kartu">
        <div className="kosong">Belum ada data santri yang ditautkan ke akun Anda.</div>
      </div>
    );
  }

  return (
    <>
      {galat ? <div className="alert alert-galat">{galat}</div> : null}
      {sukses ? <div className="alert alert-sukses">{sukses}</div> : null}

      <div className="kartu">
        <div className="kartu-judul">
          <div>
            <h3>Rapor Santri</h3>
            <span className="sub">Pratinjau sebelum diunduh dalam bentuk PDF</span>
          </div>
        </div>

        <div className="form-grid">
          {anak.length > 1 ? (
            <div className="form-item">
              <label>Anak</label>
              <select value={idDipilih} onChange={(e) => setIdDipilih(e.target.value)}>
                {anak.map((a) => (
                  <option key={a.id} value={a.id}>{a.nama} ({a.nis})</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="form-item">
            <label className="wajib">Periode Penilaian</label>
            <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
              <option value="">— Pilih periode —</option>
              {periodeList.map((p) => (
                <option key={p.periode} value={p.periode}>{p.periode}</option>
              ))}
            </select>
          </div>

          <div className="form-item">
            <label>&nbsp;</label>
            <div className="btn-grup">
              <button type="button" className="btn" onClick={unduh} disabled={!data || mengunduh}>
                {mengunduh ? 'Mengunduh...' : '⬇ Unduh PDF'}
              </button>
              <button
                type="button"
                className="btn btn-sekunder"
                disabled={!data}
                onClick={() => window.print()}
              >
                🖨 Cetak Halaman
              </button>
            </div>
          </div>
        </div>
      </div>

      {data ? (
        <RaporPreview data={data} />
      ) : (
        <div className="kartu">
          <div className="kosong">Pilih anak dan periode untuk menampilkan rapor.</div>
        </div>
      )}
    </>
  );
};

export default RaporSantri;
