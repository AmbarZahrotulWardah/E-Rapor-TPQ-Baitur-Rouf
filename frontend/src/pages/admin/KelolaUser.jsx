import { useEffect, useState, useCallback } from 'react';
import authApi from '../../api/authApi';
import { pesanGalat } from '../../api/axiosInstance';
import { ROLE_LIST_HELPER } from '../../utils/roleHelper';
import { LABEL_ROLE } from '../../utils/constants';

const FORM_KOSONG = { nama: '', email: '', password: '', role: 'ustadz', aktif: true };

/** Kelola Pengguna — Admin menambah/mengubah/menghapus akun (Decision Log D-3). */
const KelolaUser = () => {
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState('');
  const [sukses, setSukses] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_KOSONG);
  const [idDiedit, setIdDiedit] = useState(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const { data } = await authApi.daftarUser(filterRole ? { role: filterRole } : {});
      setDaftar(data.data);
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setMemuat(false);
    }
  }, [filterRole]);

  useEffect(() => {
    muat();
  }, [muat]);

  const bukaTambah = () => {
    setForm(FORM_KOSONG);
    setIdDiedit(null);
    setModal(true);
  };

  const bukaUbah = (u) => {
    setForm({ nama: u.nama, email: u.email, password: '', role: u.role, aktif: u.aktif });
    setIdDiedit(u.id);
    setModal(true);
  };

  const simpan = async (e) => {
    e.preventDefault();
    setMenyimpan(true);
    setGalat('');
    setSukses('');
    try {
      const payload = { nama: form.nama, email: form.email, role: form.role, aktif: form.aktif };
      if (form.password) payload.password = form.password;

      if (idDiedit) {
        await authApi.ubahUser(idDiedit, payload);
        setSukses('Akun berhasil diperbarui.');
      } else {
        if (!form.password) {
          setGalat('Password wajib diisi untuk akun baru.');
          return;
        }
        await authApi.tambahUser({ ...payload, password: form.password });
        setSukses('Akun berhasil ditambahkan.');
      }
      setModal(false);
      await muat();
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = async (u) => {
    if (!window.confirm(`Hapus akun "${u.nama}" (${u.email})?`)) return;
    try {
      await authApi.hapusUser(u.id);
      setSukses('Akun berhasil dihapus.');
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
            <h3>Daftar Akun Pengguna</h3>
            <span className="sub">Total {daftar.length} akun</span>
          </div>
          <div className="btn-grup">
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ width: 180 }}>
              <option value="">Semua peran</option>
              {ROLE_LIST_HELPER.map((r) => (
                <option key={r} value={r}>{LABEL_ROLE[r]}</option>
              ))}
            </select>
            <button type="button" className="btn" onClick={bukaTambah}>+ Tambah Akun</button>
          </div>
        </div>

        {memuat ? (
          <div className="pemuat">Memuat data...</div>
        ) : (
          <div className="tabel-wrap">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Peran</th>
                  <th className="tengah">Status</th>
                  <th className="tengah">Keterangan</th>
                  <th className="kanan">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((u) => (
                  <tr key={u.id}>
                    <td className="teks-tebal">{u.nama}</td>
                    <td className="mono teks-kecil">{u.email}</td>
                    <td><span className="badge badge-abu">{LABEL_ROLE[u.role]}</span></td>
                    <td className="tengah">
                      <span className={u.aktif ? 'badge badge-hijau' : 'badge badge-merah'}>
                        {u.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="tengah teks-kecil teks-abu">
                      {u.jumlahSantri !== undefined ? `${u.jumlahSantri} anak` : ''}
                      {u.jumlahKelas !== undefined ? `${u.jumlahKelas} kelas` : ''}
                    </td>
                    <td className="kanan">
                      <div className="btn-grup" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-sekunder btn-kecil" onClick={() => bukaUbah(u)}>Ubah</button>
                        <button type="button" className="btn btn-bahaya btn-kecil" onClick={() => hapus(u)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!daftar.length ? (
                  <tr><td colSpan={6} className="kosong">Belum ada akun.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal ? (
        <div className="modal-latar" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-kepala">
              <h3>{idDiedit ? 'Ubah Akun' : 'Tambah Akun Baru'}</h3>
              <button type="button" className="tombol-tutup" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={simpan}>
              <div className="modal-isi">
                <div className="form-grid">
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
                    <label className="wajib">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-item">
                    <label className="wajib">Peran</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      {ROLE_LIST_HELPER.map((r) => (
                        <option key={r} value={r}>{LABEL_ROLE[r]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-item">
                    <label className={idDiedit ? '' : 'wajib'}>
                      Password {idDiedit ? '(kosongkan jika tidak diubah)' : ''}
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      minLength={6}
                      required={!idDiedit}
                    />
                    <span className="bantuan">Minimal 6 karakter.</span>
                  </div>
                  <div className="form-item penuh">
                    <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={form.aktif}
                        onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                        style={{ width: 'auto' }}
                      />
                      Akun aktif (dapat masuk ke sistem)
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

export default KelolaUser;
