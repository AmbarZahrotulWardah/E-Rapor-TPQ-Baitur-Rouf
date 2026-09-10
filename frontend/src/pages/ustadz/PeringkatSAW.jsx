import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import santriApi from '../../api/santriApi';
import nilaiApi from '../../api/nilaiApi';
import useSAW from '../../hooks/useSAW';
import { keSkala100 } from '../../utils/formatDate';
import { kelasBadgePredikat } from '../../utils/predikatHelper';

/**
 * FR-4 — Halaman pemicu perhitungan SAW dan tampilan peringkat.
 * Dua basis normalisasi tersedia:
 *  - skala_penuh  : capaian tiap santri terhadap skala 100
 *  - antar_santri : perbandingan relatif antar santri dalam satu kelas
 */
const PeringkatSAW = () => {
  const [params] = useSearchParams();
  const { hitungKelas, hitungSantri, hasil, memuat, galat, bersihkan } = useSAW();

  const [kelasList, setKelasList] = useState([]);
  const [periodeList, setPeriodeList] = useState([]);
  const [idKelas, setIdKelas] = useState('');
  const [periode, setPeriode] = useState(params.get('periode') || '');
  const [basis, setBasis] = useState('antar_santri');
  const [pesan, setPesan] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [idSantri, setIdSantri] = useState('');

  useEffect(() => {
    santriApi.daftarKelas().then((r) => setKelasList(r.data.data)).catch(() => {});
    nilaiApi.daftarPeriode().then((r) => {
      setPeriodeList(r.data.data);
      if (!periode && r.data.data.length) setPeriode(r.data.data[0].periode);
    }).catch(() => {});
  }, [periode]);

  useEffect(() => {
    if (!idKelas) {
      setSantriList([]);
      return;
    }
    santriApi.daftar({ id_kelas: idKelas }).then((r) => setSantriList(r.data.data)).catch(() => {});
  }, [idKelas]);

  const jalankan = async () => {
    bersihkan();
    setPesan(null);
    if (!periode) {
      setPesan({ jenis: 'galat', teks: 'Periode wajib dipilih.' });
      return;
    }
    const res = await hitungKelas(idKelas, { periode, basis });
    setPesan({ jenis: res.sukses ? 'sukses' : 'galat', teks: res.pesan });
  };

  const jalankanSatu = async () => {
    bersihkan();
    setPesan(null);
    const res = await hitungSantri(idSantri, { periode, basis: 'skala_penuh' });
    setPesan({ jenis: res.sukses ? 'sukses' : 'galat', teks: res.pesan });
  };

  const daftar = hasil?.hasil || [];

  return (
    <>
      {pesan ? <div className={`alert alert-${pesan.jenis === 'sukses' ? 'sukses' : 'galat'}`}>{pesan.teks}</div> : null}
      {galat ? <div className="alert alert-galat">{galat}</div> : null}

      <div className="kartu">
        <div className="kartu-judul">
          <div>
            <h3>Jalankan Perhitungan SAW</h3>
            <span className="sub">Normalisasi matriks, pembobotan, dan nilai preferensi Vi</span>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-item">
            <label>Kelas</label>
            <select value={idKelas} onChange={(e) => setIdKelas(e.target.value)}>
              <option value="">— Pilih kelas (seluruh santri jika kosong) —</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>

          <div className="form-item">
            <label className="wajib">Periode</label>
            <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
              <option value="">— Pilih periode —</option>
              {periodeList.map((p) => (
                <option key={p.periode} value={p.periode}>
                  {p.periode} ({p.jumlahNilai} nilai)
                </option>
              ))}
            </select>
          </div>

          <div className="form-item">
            <label>Basis Normalisasi</label>
            <select value={basis} onChange={(e) => setBasis(e.target.value)}>
              <option value="antar_santri">Antar santri (untuk perangkingan)</option>
              <option value="skala_penuh">Skala penuh 100 (capaian individu)</option>
            </select>
            <span className="bantuan">
              {basis === 'antar_santri'
                ? 'Pembagi normalisasi = nilai max/min antar santri pada kelas & periode yang sama.'
                : 'Pembagi normalisasi = 100, sesuai contoh perhitungan pada dokumen metode.'}
            </span>
          </div>

          <div className="form-item">
            <label>&nbsp;</label>
            <button type="button" className="btn" onClick={jalankan} disabled={memuat || !periode}>
              {memuat ? 'Menghitung...' : 'Hitung SAW'}
            </button>
          </div>
        </div>
      </div>

      <div className="kartu">
        <div className="kartu-judul">
          <div>
            <h3>Perhitungan untuk Satu Santri</h3>
            <span className="sub">Dipakai bila hanya satu santri yang perlu dihitung ulang</span>
          </div>
        </div>
        <div className="btn-grup">
          <select value={idSantri} onChange={(e) => setIdSantri(e.target.value)} style={{ maxWidth: 320 }}>
            <option value="">— Pilih santri —</option>
            {santriList.map((s) => (
              <option key={s.id} value={s.id}>{s.nama} ({s.nis})</option>
            ))}
          </select>
          <button type="button" className="btn btn-sekunder" onClick={jalankanSatu} disabled={memuat || !idSantri || !periode}>
            Hitung Santri Ini
          </button>
          {!idKelas ? <span className="teks-kecil teks-abu">Pilih kelas terlebih dahulu.</span> : null}
        </div>
      </div>

      {hasil ? (
        <>
          <div className="grid grid-3 mb-2">
            <div className="statistik">
              <div className="label">Periode</div>
              <div className="angka" style={{ fontSize: '1.1rem' }}>{hasil.periode}</div>
              <div className="catatan">Basis: {hasil.basis.replace('_', ' ')}</div>
            </div>
            <div className="statistik">
              <div className="label">Total Bobot</div>
              <div className="angka">{Number(hasil.totalBobot).toFixed(2)}</div>
              <div className="catatan">Syarat SAW terpenuhi</div>
            </div>
            <div className="statistik">
              <div className="label">Santri Dihitung</div>
              <div className="angka">{daftar.length}</div>
              <div className="catatan">
                {hasil.santriTanpaNilai?.length ? `${hasil.santriTanpaNilai.length} tanpa data nilai` : 'Semua memiliki nilai'}
              </div>
            </div>
          </div>

          <div className="kartu">
            <div className="kartu-judul">
              <div>
                <h3>Hasil Perhitungan SAW</h3>
                <span className="sub">Diurutkan dari nilai preferensi tertinggi</span>
              </div>
            </div>
            <div className="tabel-wrap">
              <table className="tabel">
                <thead>
                  <tr>
                    <th className="tengah">Rank</th>
                    <th>NIS</th>
                    <th>Nama Santri</th>
                    {hasil.kriteria.map((k) => (
                      <th className="tengah" key={k.kode} title={k.nama}>
                        {k.kode}
                        <div className="teks-kecil teks-abu">w={k.bobot}</div>
                      </th>
                    ))}
                    <th className="tengah">Vi</th>
                    <th className="tengah">Skala 100</th>
                    <th className="tengah">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  {daftar.map((h, i) => (
                    <tr key={h.idSantri}>
                      <td className="tengah teks-tebal">
                        {h.ranking ?? i + 1}
                      </td>
                      <td className="mono">{h.nis}</td>
                      <td className="teks-tebal">{h.nama}</td>
                      {hasil.kriteria.map((k) => (
                        <td className="tengah mono teks-kecil" key={k.kode}>
                          {h.jejak.matriksR[k.kode]?.toFixed(3) ?? '-'}
                        </td>
                      ))}
                      <td className="tengah mono teks-tebal">{h.nilaiAkhir.toFixed(4)}</td>
                      <td className="tengah mono">{keSkala100(h.nilaiAkhir)}</td>
                      <td className="tengah">
                        <span className={kelasBadgePredikat(h.predikat)}>{h.predikat}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="teks-kecil teks-abu mt-2 mb-0">
              Angka pada kolom C1-C5 adalah hasil normalisasi (R). Nilai preferensi Vi = Σ (bobot × R).
            </p>
          </div>

          {hasil.santriTanpaNilai?.length ? (
            <div className="alert alert-peringatan">
              Santri berikut belum memiliki nilai pada periode ini sehingga tidak dihitung:{' '}
              {hasil.santriTanpaNilai.map((s) => s.nama).join(', ')}.
            </div>
          ) : null}
        </>
      ) : (
        <div className="kartu">
          <div className="kosong">
            Pilih periode lalu klik <strong>Hitung SAW</strong> untuk melihat hasil perhitungan.
          </div>
        </div>
      )}
    </>
  );
};

export default PeringkatSAW;
