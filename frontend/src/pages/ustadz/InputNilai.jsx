import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import santriApi from '../../api/santriApi';
import nilaiApi from '../../api/nilaiApi';
import useNilai from '../../hooks/useNilai';
import { pesanGalat } from '../../api/axiosInstance';
import { SKOR_MIN, SKOR_MAX } from '../../utils/constants';

const PERIODE_AKTIF = 'Ganjil 2025/2026';

/** FR-3 — Input nilai per kriteria untuk satu santri dalam satu pertemuan. */
const InputNilai = () => {
  const [params] = useSearchParams();
  const { kriteria, muatKriteria, simpanBatch, memuat, galat, bersihkanGalat } = useNilai();

  const [kelasList, setKelasList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [idKelas, setIdKelas] = useState(params.get('kelas') || '');
  const [idSantri, setIdSantri] = useState('');
  const [pertemuanKe, setPertemuanKe] = useState(1);
  const [periode, setPeriode] = useState(PERIODE_AKTIF);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState('');
  const [skor, setSkor] = useState({});
  const [pesan, setPesan] = useState(null);
  const [riwayat, setRiwayat] = useState([]);

  useEffect(() => {
    muatKriteria();
    santriApi.daftarKelas().then((r) => setKelasList(r.data.data)).catch(() => {});
  }, [muatKriteria]);

  const muatSantri = useCallback(async (kelasId) => {
    if (!kelasId) {
      setSantriList([]);
      return;
    }
    try {
      const { data } = await santriApi.daftar({ id_kelas: kelasId });
      setSantriList(data.data);
      setIdSantri('');
      setSkor({});
    } catch (e) {
      setPesan({ jenis: 'galat', teks: pesanGalat(e) });
    }
  }, []);

  useEffect(() => {
    muatSantri(idKelas);
  }, [idKelas, muatSantri]);

  // Muat riwayat nilai saat santri dipilih.
  useEffect(() => {
    if (!idSantri) {
      setRiwayat([]);
      return;
    }
    nilaiApi
      .daftar({ id_santri: idSantri, periode })
      .then((r) => setRiwayat(r.data.data))
      .catch(() => setRiwayat([]));
  }, [idSantri, periode]);

  const ubahSkor = (kode, nilai) => setSkor((s) => ({ ...s, [kode]: nilai }));

  const kirim = async (e) => {
    e.preventDefault();
    bersihkanGalat();
    setPesan(null);

    const nilai = kriteria
      .filter((k) => skor[k.kode] !== '' && skor[k.kode] !== undefined && skor[k.kode] !== null)
      .map((k) => ({ id_kriteria: k.id, skor: Number(skor[k.kode]) }));

    if (!nilai.length) {
      setPesan({ jenis: 'galat', teks: 'Isi minimal satu kriteria sebelum menyimpan.' });
      return;
    }

    const hasil = await simpanBatch({
      id_santri: Number(idSantri),
      pertemuan_ke: Number(pertemuanKe),
      periode,
      tanggal,
      nilai,
      catatan,
    });

    if (hasil.sukses) {
      setPesan({ jenis: 'sukses', teks: hasil.pesan });
      setSkor({});
      const { data } = await nilaiApi.daftar({ id_santri: idSantri, periode });
      setRiwayat(data.data);
    } else {
      setPesan({ jenis: 'galat', teks: hasil.pesan });
    }
  };

  return (
    <>
      {pesan ? <div className={`alert alert-${pesan.jenis === 'sukses' ? 'sukses' : 'galat'}`}>{pesan.teks}</div> : null}
      {galat ? <div className="alert alert-galat">{galat}</div> : null}

      <div className="kartu">
        <div className="kartu-judul">
          <div>
            <h3>Form Input Nilai</h3>
            <span className="sub">Isi skor 0-100 untuk setiap kriteria pada satu pertemuan</span>
          </div>
        </div>

        <form onSubmit={kirim}>
          <div className="form-grid">
            <div className="form-item">
              <label className="wajib">Kelas</label>
              <select value={idKelas} onChange={(e) => setIdKelas(e.target.value)} required>
                <option value="">— Pilih kelas —</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                ))}
              </select>
            </div>

            <div className="form-item">
              <label className="wajib">Santri</label>
              <select value={idSantri} onChange={(e) => setIdSantri(e.target.value)} required disabled={!idKelas}>
                <option value="">— Pilih santri —</option>
                {santriList.map((s) => (
                  <option key={s.id} value={s.id}>{s.nama} ({s.nis})</option>
                ))}
              </select>
            </div>

            <div className="form-item">
              <label className="wajib">Periode</label>
              <input type="text" value={periode} onChange={(e) => setPeriode(e.target.value)} required />
              <span className="bantuan">Contoh: Ganjil 2025/2026 atau September 2025</span>
            </div>

            <div className="form-item">
              <label className="wajib">Pertemuan Ke-</label>
              <input
                type="number"
                min="1"
                value={pertemuanKe}
                onChange={(e) => setPertemuanKe(e.target.value)}
                required
              />
            </div>

            <div className="form-item">
              <label className="wajib">Tanggal Pertemuan</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
            </div>

            <div className="form-item">
              <label>Catatan</label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Opsional"
                maxLength={255}
              />
            </div>
          </div>

          <h3 className="mt-2 mb-1">Skor per Kriteria</h3>
          <div className="grid grid-3">
            {kriteria.map((k) => (
              <div className="form-item" key={k.id}>
                <label>
                  <span className="mono">{k.kode}</span> — {k.nama}
                  <span className="badge badge-abu" style={{ marginLeft: 6 }}>{k.kelompok}</span>
                </label>
                <input
                  type="number"
                  min={SKOR_MIN}
                  max={SKOR_MAX}
                  step="0.5"
                  value={skor[k.kode] ?? ''}
                  onChange={(e) => ubahSkor(k.kode, e.target.value)}
                  placeholder="0 - 100"
                />
              </div>
            ))}
          </div>

          <div className="btn-grup mt-2">
            <button type="submit" className="btn" disabled={memuat || !idSantri}>
              {memuat ? 'Menyimpan...' : 'Simpan Nilai'}
            </button>
            <button
              type="button"
              className="btn btn-sekunder"
              onClick={() => {
                setSkor({});
                setPesan(null);
                bersihkanGalat();
              }}
            >
              Bersihkan
            </button>
            <span className="teks-kecil teks-abu">
              {Object.values(skor).filter((v) => v !== '' && v !== undefined).length} kriteria terisi
            </span>
          </div>
        </form>
      </div>

      <div className="kartu">
        <div className="kartu-judul">
          <div>
            <h3>Riwayat Nilai</h3>
            <span className="sub">
              {idSantri ? `Periode ${periode} — ${riwayat.length} data` : 'Pilih santri untuk melihat riwayat'}
            </span>
          </div>
        </div>

        {!idSantri ? (
          <div className="kosong">Pilih kelas dan santri terlebih dahulu.</div>
        ) : riwayat.length ? (
          <div className="tabel-wrap">
            <table className="tabel">
              <thead>
                <tr>
                  <th className="tengah">Pertemuan</th>
                  <th>Tanggal</th>
                  <th>Kriteria</th>
                  <th className="tengah">Skor</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((n) => (
                  <tr key={n.id}>
                    <td className="tengah">{n.pertemuan_ke}</td>
                    <td className="teks-kecil">{n.tanggal}</td>
                    <td>
                      <span className="mono">{n.kriteria?.kode}</span> {n.kriteria?.nama}
                    </td>
                    <td className="tengah mono">{Number(n.skor).toFixed(2)}</td>
                    <td className="teks-kecil teks-abu">{n.catatan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="kosong">Belum ada nilai untuk santri ini pada periode tersebut.</div>
        )}
      </div>
    </>
  );
};

export default InputNilai;
