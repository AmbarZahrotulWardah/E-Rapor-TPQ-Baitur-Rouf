import { useEffect, useState, useCallback } from 'react';
import nilaiApi from '../../api/nilaiApi';
import sawApi from '../../api/sawApi';
import { pesanGalat } from '../../api/axiosInstance';

const FORM_KOSONG = {
  kode: '',
  nama: '',
  bobot: '',
  jenis: 'benefit',
  kelompok: 'tajwid',
  urutan: 0,
  aktif: true,
};

/**
 * Kelola Kriteria & Bobot SAW (FR-4).
 * Bobot disimpan di database, bukan di-hardcode, agar Admin dapat
 * mengubah proporsi penilaian sesuai kebijakan TPQ (Decision Log D-1).
 */
const KelolaKriteria = () => {
  const [daftar, setDaftar] = useState([]);
  const [info, setInfo] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState('');
  const [sukses, setSukses] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_KOSONG);
  const [idDiedit, setIdDiedit] = useState(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const [resKriteria, resSaw] = await Promise.all([
        nilaiApi.daftarKriteria({ semua: 'true' }),
        sawApi.kriteria(),
      ]);
      setDaftar(resKriteria.data.data);
      setInfo(resSaw.data.data);
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  const totalBobotAktif = daftar
    .filter((k) => k.aktif)
    .reduce((a, k) => a + Number(k.bobot), 0);

  const bobotValid = Math.abs(totalBobotAktif - 1) < 0.001;

  const bukaTambah = () => {
    setForm({ ...FORM_KOSONG, urutan: daftar.length + 1 });
    setIdDiedit(null);
    setModal(true);
  };

  const bukaUbah = (k) => {
    setForm({
      kode: k.kode,
      nama: k.nama,
      bobot: Number(k.bobot),
      jenis: k.jenis,
      kelompok: k.kelompok,
      urutan: k.urutan,
      aktif: k.aktif,
    });
    setIdDiedit(k.id);
    setModal(true);
  };

  const simpan = async (e) => {
    e.preventDefault();
    setMenyimpan(true);
    setGalat('');
    setSukses('');
    try {
      const payload = { ...form, bobot: Number(form.bobot), urutan: Number(form.urutan) };
      if (idDiedit) {
        await nilaiApi.ubahKriteria(idDiedit, payload);
        setSukses('Kriteria berhasil diperbarui.');
      } else {
        await nilaiApi.tambahKriteria(payload);
        setSukses('Kriteria berhasil ditambahkan.');
      }
      setModal(false);
      await muat();
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = async (k) => {
    if (!window.confirm(`Hapus kriteria "${k.nama}"? Nilai yang sudah ada untuk kriteria ini tidak dapat dipulihkan.`)) return;
    try {
      await nilaiApi.hapusKriteria(k.id);
      setSukses('Kriteria berhasil dihapus.');
      await muat();
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  };

  return (
    <>
      {galat ? <div className="alert alert-galat">{galat}</div> : null}
      {sukses ? <div className="alert alert-sukses">{sukses}</div> : null}

      {info && !info.valid ? (
        <div className="alert alert-peringatan">
          <strong>Perhitungan SAW belum dapat dijalankan.</strong> {info.pesanValidasi}
        </div>
      ) : null}

      <div className="grid grid-3 mb-2">
        <div className="statistik">
          <div className="label">Jumlah Kriteria</div>
          <div className="angka">{daftar.length}</div>
          <div className="catatan">{daftar.filter((k) => k.aktif).length} kriteria aktif</div>
        </div>
        <div className="statistik" style={{ borderLeftColor: bobotValid ? '#1a7f37' : '#cf222e' }}>
          <div className="label">Total Bobot Aktif</div>
          <div className="angka" style={{ color: bobotValid ? '#1a7f37' : '#cf222e' }}>
            {totalBobotAktif.toFixed(2)}
          </div>
          <div className="catatan">{bobotValid ? 'Valid — syarat SAW terpenuhi' : 'Harus sama dengan 1.00'}</div>
        </div>
        <div className="statistik">
          <div className="label">Bobot Terbesar</div>
          <div className="angka">
            {daftar.length
              ? Math.max(...daftar.filter((k) => k.aktif).map((k) => Number(k.bobot)), 0).toFixed(2)
              : '-'}
          </div>
          <div className="catatan">
            {daftar.filter((k) => k.aktif).sort((a, b) => Number(b.bobot) - Number(a.bobot))[0]?.nama || '-'}
          </div>
        </div>
      </div>

      <div className="kartu">
        <div className="kartu-judul">
          <div>
            <h3>Daftar Kriteria Penilaian</h3>
            <span className="sub">Kriteria tajwid dan akademik beserta bobotnya</span>
          </div>
          <button type="button" className="btn" onClick={bukaTambah}>+ Tambah Kriteria</button>
        </div>

        {memuat ? (
          <div className="pemuat">Memuat data...</div>
        ) : (
          <div className="tabel-wrap">
            <table className="tabel">
              <thead>
                <tr>
                  <th className="tengah">Urut</th>
                  <th>Kode</th>
                  <th>Nama Kriteria</th>
                  <th className="tengah">Kelompok</th>
                  <th className="tengah">Jenis</th>
                  <th className="tengah">Bobot</th>
                  <th className="tengah">Status</th>
                  <th className="kanan">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((k) => (
                  <tr key={k.id}>
                    <td className="tengah">{k.urutan}</td>
                    <td className="mono teks-tebal">{k.kode}</td>
                    <td>{k.nama}</td>
                    <td className="tengah">
                      <span className={k.kelompok === 'akademik' ? 'badge badge-biru' : 'badge badge-hijau'}>
                        {k.kelompok}
                      </span>
                    </td>
                    <td className="tengah teks-kecil">{k.jenis}</td>
                    <td className="tengah mono">{Number(k.bobot).toFixed(2)}</td>
                    <td className="tengah">
                      <span className={k.aktif ? 'badge badge-hijau' : 'badge badge-abu'}>
                        {k.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="kanan">
                      <div className="btn-grup" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-sekunder btn-kecil" onClick={() => bukaUbah(k)}>Ubah</button>
                        <button type="button" className="btn btn-bahaya btn-kecil" onClick={() => hapus(k)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="kanan">Total bobot kriteria aktif</td>
                  <td className="tengah mono">{totalBobotAktif.toFixed(2)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="teks-kecil teks-abu mt-2 mb-0">
          Metode SAW mensyaratkan total bobot seluruh kriteria aktif sama dengan 1.00.
          Kriteria berjenis <em>benefit</em> berarti semakin besar nilainya semakin baik,
          sedangkan <em>cost</em> berarti semakin kecil semakin baik.
        </p>
      </div>

      {modal ? (
        <div className="modal-latar" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-kepala">
              <h3>{idDiedit ? 'Ubah Kriteria' : 'Tambah Kriteria'}</h3>
              <button type="button" className="tombol-tutup" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={simpan}>
              <div className="modal-isi">
                <div className="form-grid">
                  <div className="form-item">
                    <label className="wajib">Kode</label>
                    <input
                      type="text"
                      value={form.kode}
                      onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
                      placeholder="C6"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="form-item">
                    <label className="wajib">Nama Kriteria</label>
                    <input
                      type="text"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      placeholder="Adab dan Akhlak"
                      required
                    />
                  </div>
                  <div className="form-item">
                    <label className="wajib">Bobot (0 - 1)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={form.bobot}
                      onChange={(e) => setForm({ ...form, bobot: e.target.value })}
                      required
                    />
                    <span className="bantuan">
                      Total bobot aktif saat ini {totalBobotAktif.toFixed(2)}
                      {idDiedit ? '' : ` → menjadi ${(totalBobotAktif + Number(form.bobot || 0)).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="form-item">
                    <label className="wajib">Jenis</label>
                    <select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })}>
                      <option value="benefit">Benefit (semakin besar semakin baik)</option>
                      <option value="cost">Cost (semakin kecil semakin baik)</option>
                    </select>
                  </div>
                  <div className="form-item">
                    <label className="wajib">Kelompok</label>
                    <select value={form.kelompok} onChange={(e) => setForm({ ...form, kelompok: e.target.value })}>
                      <option value="tajwid">Tajwid</option>
                      <option value="akademik">Akademik</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="form-item">
                    <label>Urutan Tampil</label>
                    <input
                      type="number"
                      min="0"
                      value={form.urutan}
                      onChange={(e) => setForm({ ...form, urutan: e.target.value })}
                    />
                  </div>
                  <div className="form-item penuh">
                    <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={form.aktif}
                        onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                        style={{ width: 'auto' }}
                      />
                      Kriteria aktif (ikut dihitung dalam SAW)
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-kaki">
                <button type="button" className="btn btn-sekunder" onClick={() => setModal(false)}>Batal</button>
                <button type="submit" className="btn" disabled={menyimpan}>
                  {menyimpan ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default KelolaKriteria;
