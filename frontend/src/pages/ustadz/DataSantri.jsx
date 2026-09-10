import { useEffect, useState, useCallback } from 'react';
import santriApi from '../../api/santriApi';
import authApi from '../../api/authApi';
import { pesanGalat } from '../../api/axiosInstance';
import { formatTanggal } from '../../utils/formatDate';
import { JENIS_KELAMIN, STATUS_SANTRI } from '../../utils/constants';

const FORM_KOSONG = {
  nis: '',
  nama: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: 'L',
  alamat: '',
  id_kelas: '',
  id_wali: '',
  status: 'aktif',
};

/** FR-2 — Data Santri. */
const DataSantri = () => {
  const [daftar, setDaftar] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [waliList, setWaliList] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState('');
  const [sukses, setSukses] = useState('');
  const [cari, setCari] = useState('');
  const [filterKelas, setFilterKelas] = useState('');

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_KOSONG);
  const [idDiedit, setIdDiedit] = useState(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const params = {};
      if (cari) params.cari = cari;
      if (filterKelas) params.id_kelas = filterKelas;
      const res = await santriApi.daftar(params);
      setDaftar(res.data.data);
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setMemuat(false);
    }
  }, [cari, filterKelas]);

  useEffect(() => {
    muat();
  }, [muat]);

  useEffect(() => {
    santriApi.daftarKelas().then((r) => setKelasList(r.data.data)).catch(() => {});
  }, []);

  // Daftar wali santri diambil dari modul pengguna.
  useEffect(() => {
    authApi
      .daftarUser({ role: 'wali_santri' })
      .then((r) => setWaliList(r.data.data))
      .catch(() => {});
  }, []);

  const bukaTambah = () => {
    setForm(FORM_KOSONG);
    setIdDiedit(null);
    setModal(true);
  };

  const bukaUbah = (s) => {
    setForm({
      nis: s.nis,
      nama: s.nama,
      tempat_lahir: s.tempat_lahir || '',
      tanggal_lahir: s.tanggal_lahir || '',
      jenis_kelamin: s.jenis_kelamin || 'L',
      alamat: s.alamat || '',
      id_kelas: s.id_kelas || '',
      id_wali: s.id_wali || '',
      status: s.status || 'aktif',
    });
    setIdDiedit(s.id);
    setModal(true);
  };

  const simpan = async (e) => {
    e.preventDefault();
    setMenyimpan(true);
    setGalat('');
    setSukses('');
    try {
      const payload = {
        ...form,
        id_kelas: form.id_kelas || null,
        id_wali: form.id_wali || null,
      };
      if (idDiedit) {
        await santriApi.ubah(idDiedit, payload);
        setSukses('Data santri berhasil diperbarui.');
      } else {
        await santriApi.tambah(payload);
        setSukses('Data santri berhasil ditambahkan.');
      }
      setModal(false);
      await muat();
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = async (s) => {
    if (!window.confirm(`Hapus data santri "${s.nama}" (NIS ${s.nis})?`)) return;
    try {
      await santriApi.hapus(s.id);
      setSukses('Data santri berhasil dihapus.');
      await muat();
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  };

  return (
    <>
      {galat ? <div className="alert alert-galat">{galat}</div> : null}
      {sukses ? <div className="alert alert-sukses">{sukses}</div> : null}

      <div className="kartu">
        <div className="kartu-judul">
          <div>
            <h3>Daftar Santri</h3>
            <span className="sub">Total {daftar.length} santri</span>
          </div>
          <button type="button" className="btn" onClick={bukaTambah}>+ Tambah Santri</button>
        </div>

        <div className="btn-grup mb-2">
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            style={{ maxWidth: 260 }}
          />
          <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">Semua kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>

        {memuat ? (
          <div className="pemuat">Memuat data...</div>
        ) : (
          <div className="tabel-wrap">
            <table className="tabel">
              <thead>
                <tr>
                  <th>NIS</th>
                  <th>Nama Santri</th>
                  <th>Tempat, Tanggal Lahir</th>
                  <th className="tengah">L/P</th>
                  <th>Kelas</th>
                  <th>Wali Santri</th>
                  <th className="tengah">Status</th>
                  <th className="kanan">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((s) => (
                  <tr key={s.id}>
                    <td className="mono">{s.nis}</td>
                    <td className="teks-tebal">{s.nama}</td>
                    <td className="teks-kecil">
                      {s.tempat_lahir || '-'}, {formatTanggal(s.tanggal_lahir)}
                    </td>
                    <td className="tengah">{s.jenis_kelamin || '-'}</td>
                    <td>{s.kelas?.nama_kelas || <span className="teks-abu">Belum ada</span>}</td>
                    <td className="teks-kecil">{s.wali?.nama || <span className="teks-abu">Belum ditautkan</span>}</td>
                    <td className="tengah">
                      <span className={s.status === 'aktif' ? 'badge badge-hijau' : 'badge badge-abu'}>{s.status}</span>
                    </td>
                    <td className="kanan">
                      <div className="btn-grup" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-sekunder btn-kecil" onClick={() => bukaUbah(s)}>Ubah</button>
                        <button type="button" className="btn btn-bahaya btn-kecil" onClick={() => hapus(s)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!daftar.length ? <tr><td colSpan={8} className="kosong">Tidak ada data santri.</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal ? (
        <div className="modal-latar" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-kepala">
              <h3>{idDiedit ? 'Ubah Data Santri' : 'Tambah Santri Baru'}</h3>
              <button type="button" className="tombol-tutup" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={simpan}>
              <div className="modal-isi">
                <div className="form-grid">
                  <div className="form-item">
                    <label className="wajib">NIS</label>
                    <input
                      type="text"
                      value={form.nis}
                      onChange={(e) => setForm({ ...form, nis: e.target.value })}
                      placeholder="2025013"
                      maxLength={20}
                      required
                    />
                  </div>
                  <div className="form-item">
                    <label className="wajib">Nama Lengkap</label>
                    <input
                      type="text"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-item">
                    <label>Tempat Lahir</label>
                    <input
                      type="text"
                      value={form.tempat_lahir}
                      onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })}
                    />
                  </div>
                  <div className="form-item">
                    <label>Tanggal Lahir</label>
                    <input
                      type="date"
                      value={form.tanggal_lahir}
                      onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
                    />
                  </div>
                  <div className="form-item">
                    <label>Jenis Kelamin</label>
                    <select value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}>
                      {JENIS_KELAMIN.map((j) => (
                        <option key={j.value} value={j.value}>{j.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-item">
                    <label>Kelas</label>
                    <select value={form.id_kelas} onChange={(e) => setForm({ ...form, id_kelas: e.target.value })}>
                      <option value="">— Pilih kelas —</option>
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-item penuh">
                    <label>Wali Santri</label>
                    <select value={form.id_wali} onChange={(e) => setForm({ ...form, id_wali: e.target.value })}>
                      <option value="">— Pilih wali —</option>
                      {waliList.map((w) => (
                        <option key={w.id} value={w.id}>{w.nama} ({w.email})</option>
                      ))}
                    </select>
                    <span className="bantuan">
                      Wali santri didaftarkan lebih dahulu oleh Admin melalui menu Kelola Pengguna.
                    </span>
                  </div>
                  <div className="form-item penuh">
                    <label>Alamat</label>
                    <textarea
                      rows={2}
                      value={form.alamat}
                      onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    />
                  </div>
                  <div className="form-item">
                    <label>Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {STATUS_SANTRI.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
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

export default DataSantri;
