/**
 * Black Box Testing — Sistem E-Rapor TPQ Baitur Rouf
 * Acuan: PRD §7 (metode pengujian) dan Vault/flow.md §7.
 *
 * Pengujian dilakukan terhadap API yang berjalan sungguhan dengan database
 * MySQL, tanpa melihat isi kode: hanya input (permintaan HTTP) dan output
 * (status + isi respons) yang diperiksa.
 *
 * Prasyarat : server backend berjalan dan database sudah di-seed.
 * Dijalankan : npm run test:blackbox
 */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';
const API = `${BASE}/api/v1`;
const PERIODE = 'Ganjil 2025/2026';

const AKUN = {
  admin: { email: 'admin@tpqbaiturrouf.sch.id', password: 'admin123' },
  ustadz: { email: 'ustadz1@tpqbaiturrouf.sch.id', password: 'ustadz123' },
  wali: { email: 'wali1@tpqbaiturrouf.sch.id', password: 'wali123' },
  wali2: { email: 'wali2@tpqbaiturrouf.sch.id', password: 'wali123' },
};

const token = {};

/** Helper permintaan HTTP tanpa dependensi tambahan. */
const minta = async (method, path, { body, tokenJwt, responseType } = {}) => {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (tokenJwt) headers.Authorization = `Bearer ${tokenJwt}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (responseType === 'buffer') {
    const buffer = Buffer.from(await res.arrayBuffer());
    return { status: res.status, headers: res.headers, buffer };
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, headers: res.headers, body: json };
};

before(async () => {
  const cek = await fetch(`${BASE}/health`);
  assert.ok(cek.ok, `Backend tidak aktif di ${BASE}. Jalankan "npm start" terlebih dahulu.`);

  for (const [kunci, akun] of Object.entries(AKUN)) {
    const res = await minta('POST', '/auth/login', { body: akun });
    assert.strictEqual(res.status, 200, `Gagal login sebagai ${kunci}`);
    token[kunci] = res.body.data.token;
  }
});

after(() => {});

/* ============================== FR-1 ============================== */
describe('FR-1 Login sesuai peran', () => {
  test('BB-01 login admin berhasil dan menerima token', async () => {
    const res = await minta('POST', '/auth/login', { body: AKUN.admin });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.role, 'admin');
  });

  test('BB-02 login mengarahkan tiap role ke dashboard masing-masing', async () => {
    const admin = await minta('POST', '/auth/login', { body: AKUN.admin });
    const ustadz = await minta('POST', '/auth/login', { body: AKUN.ustadz });
    const wali = await minta('POST', '/auth/login', { body: AKUN.wali });
    assert.strictEqual(admin.body.data.redirectTo, '/admin/dashboard');
    assert.strictEqual(ustadz.body.data.redirectTo, '/ustadz/dashboard');
    assert.strictEqual(wali.body.data.redirectTo, '/wali/dashboard');
  });

  test('BB-03 password salah ditolak dengan 401', async () => {
    const res = await minta('POST', '/auth/login', {
      body: { email: AKUN.admin.email, password: 'password-salah' },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('BB-04 email tidak terdaftar ditolak dengan 401', async () => {
    const res = await minta('POST', '/auth/login', {
      body: { email: 'tidak-ada@contoh.com', password: 'apapun123' },
    });
    assert.strictEqual(res.status, 401);
  });

  test('BB-05 email kosong ditolak validasi dengan 422', async () => {
    const res = await minta('POST', '/auth/login', { body: { email: '', password: 'admin123' } });
    assert.strictEqual(res.status, 422);
    assert.ok(res.body.errors.length > 0);
  });

  test('BB-06 format email tidak valid ditolak dengan 422', async () => {
    const res = await minta('POST', '/auth/login', { body: { email: 'bukan-email', password: 'admin123' } });
    assert.strictEqual(res.status, 422);
  });

  test('BB-07 akses tanpa token ditolak dengan 401', async () => {
    const res = await minta('GET', '/santri');
    assert.strictEqual(res.status, 401);
  });

  test('BB-08 token tidak valid ditolak dengan 401', async () => {
    const res = await minta('GET', '/santri', { tokenJwt: 'token.palsu.xyz' });
    assert.strictEqual(res.status, 401);
  });

  test('BB-09 wali santri tidak dapat membuka halaman admin (403)', async () => {
    const res = await minta('GET', '/users', { tokenJwt: token.wali });
    assert.strictEqual(res.status, 403);
  });

  test('BB-10 ustadz tidak dapat mengelola pengguna (403)', async () => {
    const res = await minta('POST', '/users', {
      tokenJwt: token.ustadz,
      body: { nama: 'X', email: 'x@y.com', password: 'rahasia123', role: 'admin' },
    });
    assert.strictEqual(res.status, 403);
  });
});

/* ============================== FR-2 ============================== */
describe('FR-2 Input data santri', () => {
  const nisUji = `T${Date.now()}`;
  let idBaru = null;

  test('BB-11 tambah santri dengan data lengkap berhasil (201)', async () => {
    const res = await minta('POST', '/santri', {
      tokenJwt: token.admin,
      body: {
        nis: nisUji,
        nama: 'Santri Uji Coba',
        tempat_lahir: 'Surabaya',
        tanggal_lahir: '2016-05-10',
        jenis_kelamin: 'L',
        id_kelas: 1,
        id_wali: 4,
      },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.nis, nisUji);
    idBaru = res.body.data.id;
  });

  test('BB-12 NIS duplikat ditolak dengan 409', async () => {
    const res = await minta('POST', '/santri', {
      tokenJwt: token.admin,
      body: { nis: nisUji, nama: 'Duplikat NIS' },
    });
    assert.strictEqual(res.status, 409);
  });

  test('BB-13 NIS kosong ditolak validasi dengan 422', async () => {
    const res = await minta('POST', '/santri', {
      tokenJwt: token.admin,
      body: { nis: '', nama: '' },
    });
    assert.strictEqual(res.status, 422);
  });

  test('BB-14 jenis kelamin di luar L/P ditolak dengan 422', async () => {
    const res = await minta('POST', '/santri', {
      tokenJwt: token.admin,
      body: { nis: `${nisUji}X`, nama: 'Uji JK', jenis_kelamin: 'Z' },
    });
    assert.strictEqual(res.status, 422);
  });

  test('BB-15 akun wali yang bukan role wali_santri ditolak (422)', async () => {
    const res = await minta('POST', '/santri', {
      tokenJwt: token.admin,
      body: { nis: `${nisUji}W`, nama: 'Uji Wali', id_wali: 1 },
    });
    assert.strictEqual(res.status, 422);
  });

  test('BB-16 ubah data santri berhasil (200)', async () => {
    const res = await minta('PUT', `/santri/${idBaru}`, {
      tokenJwt: token.admin,
      body: { nama: 'Santri Uji Coba (Diperbarui)', status: 'aktif' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.nama, 'Santri Uji Coba (Diperbarui)');
  });

  test('BB-17 daftar santri dapat dicari berdasarkan nama', async () => {
    const res = await minta('GET', '/santri?cari=Uji%20Coba', { tokenJwt: token.admin });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length >= 1);
  });

  test('BB-18 detail santri yang tidak ada menghasilkan 404', async () => {
    const res = await minta('GET', '/santri/999999', { tokenJwt: token.admin });
    assert.strictEqual(res.status, 404);
  });

  test('BB-19 wali santri tidak dapat menambah santri (403)', async () => {
    const res = await minta('POST', '/santri', {
      tokenJwt: token.wali,
      body: { nis: `${nisUji}Z`, nama: 'Terlarang' },
    });
    assert.strictEqual(res.status, 403);
  });

  test('BB-20 hapus data uji berhasil (200)', async () => {
    const res = await minta('DELETE', `/santri/${idBaru}`, { tokenJwt: token.admin });
    assert.strictEqual(res.status, 200);
  });
});

/* ============================== FR-3 ============================== */
describe('FR-3 Input nilai per kriteria', () => {
  let idNilai = null;
  const payload = {
    id_santri: 1,
    id_kriteria: 1,
    pertemuan_ke: 99,
    periode: PERIODE,
    tanggal: '2025-12-01',
  };

  test('BB-21 input nilai valid berhasil (201)', async () => {
    const res = await minta('POST', '/nilai', {
      tokenJwt: token.ustadz,
      body: { ...payload, skor: 88 },
    });
    assert.strictEqual(res.status, 201);
    idNilai = res.body.data.id;
  });

  test('BB-22 skor lebih dari 100 ditolak dengan 422', async () => {
    const res = await minta('POST', '/nilai', {
      tokenJwt: token.ustadz,
      body: { ...payload, skor: 150, pertemuan_ke: 98 },
    });
    assert.strictEqual(res.status, 422);
  });

  test('BB-23 skor negatif ditolak dengan 422', async () => {
    const res = await minta('POST', '/nilai', {
      tokenJwt: token.ustadz,
      body: { ...payload, skor: -5, pertemuan_ke: 97 },
    });
    assert.strictEqual(res.status, 422);
  });

  test('BB-24 skor kosong ditolak dengan 422', async () => {
    const res = await minta('POST', '/nilai', {
      tokenJwt: token.ustadz,
      body: { ...payload, skor: '', pertemuan_ke: 96 },
    });
    assert.strictEqual(res.status, 422);
  });

  test('BB-25 kriteria tidak dikenal ditolak dengan 404', async () => {
    const res = await minta('POST', '/nilai', {
      tokenJwt: token.ustadz,
      body: { ...payload, id_kriteria: 9999, skor: 80, pertemuan_ke: 95 },
    });
    assert.strictEqual(res.status, 404);
  });

  test('BB-26 wali santri tidak dapat menginput nilai (403)', async () => {
    const res = await minta('POST', '/nilai', {
      tokenJwt: token.wali,
      body: { ...payload, skor: 80, pertemuan_ke: 94 },
    });
    assert.strictEqual(res.status, 403);
  });

  test('BB-27 input nilai massal (batch) berhasil (201)', async () => {
    const res = await minta('POST', '/nilai/batch', {
      tokenJwt: token.ustadz,
      body: {
        id_santri: 1,
        pertemuan_ke: 93,
        periode: PERIODE,
        tanggal: '2025-12-02',
        nilai: [
          { id_kriteria: 1, skor: 80 },
          { id_kriteria: 2, skor: 85 },
        ],
      },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.jumlah, 2);
  });

  test('BB-28 ubah nilai berhasil (200)', async () => {
    const res = await minta('PUT', `/nilai/${idNilai}`, {
      tokenJwt: token.ustadz,
      body: { skor: 91 },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(Number(res.body.data.skor), 91);
  });

  test('BB-29 hapus data nilai uji berhasil (200)', async () => {
    const res = await minta('DELETE', `/nilai/${idNilai}`, { tokenJwt: token.ustadz });
    assert.strictEqual(res.status, 200);
  });
});

/* ============================== FR-4 ============================== */
describe('FR-4 Perhitungan SAW otomatis', () => {
  test('BB-30 total bobot kriteria aktif dilaporkan valid (= 1)', async () => {
    const res = await minta('GET', '/saw/kriteria', { tokenJwt: token.admin });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.valid, true);
    assert.strictEqual(res.body.data.totalBobot, 1);
  });

  test('BB-31 hasil SAW santri 1 sama persis dengan perhitungan manual (Vi = 0.7975)', async () => {
    const res = await minta('GET', `/saw/hitung/1?periode=${encodeURIComponent(PERIODE)}`, {
      tokenJwt: token.admin,
    });
    assert.strictEqual(res.status, 200);
    const hasil = res.body.data.hasil[0];
    assert.strictEqual(hasil.nilaiAkhir, 0.7975);
    assert.strictEqual(hasil.predikat, 'Baik');
  });

  test('BB-32 hasil normalisasi sesuai rumus benefit r = x / 100', async () => {
    const res = await minta('GET', `/saw/hitung/1?periode=${encodeURIComponent(PERIODE)}`, {
      tokenJwt: token.admin,
    });
    assert.deepStrictEqual(res.body.data.hasil[0].jejak.matriksR, {
      C1: 0.8, C2: 0.85, C3: 0.75, C4: 0.9, C5: 0.7,
    });
  });

  test('BB-33 perhitungan SAW deterministik untuk input yang sama', async () => {
    const url = `/saw/hitung/1?periode=${encodeURIComponent(PERIODE)}`;
    const a = await minta('GET', url, { tokenJwt: token.admin });
    const b = await minta('GET', url, { tokenJwt: token.admin });
    assert.strictEqual(a.body.data.hasil[0].nilaiAkhir, b.body.data.hasil[0].nilaiAkhir);
  });

  test('BB-34 perhitungan tanpa parameter periode ditolak dengan 422', async () => {
    const res = await minta('GET', '/saw/hitung/1', { tokenJwt: token.admin });
    assert.strictEqual(res.status, 422);
  });

  test('BB-35 santri tanpa nilai pada periode tersebut menghasilkan 422', async () => {
    const res = await minta('GET', `/saw/hitung/1?periode=Periode%20Kosong`, {
      tokenJwt: token.admin,
    });
    assert.strictEqual(res.status, 422);
  });

  test('BB-36 perhitungan per kelas menghasilkan peringkat antar santri', async () => {
    const res = await minta('GET', `/saw/hitung-kelas/1?periode=${encodeURIComponent(PERIODE)}`, {
      tokenJwt: token.admin,
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.hasil.length >= 2);
    assert.ok(res.body.data.hasil[0].ranking);
  });

  test('BB-37 wali santri tidak dapat memicu perhitungan SAW (403)', async () => {
    const res = await minta('GET', `/saw/hitung/1?periode=${encodeURIComponent(PERIODE)}`, {
      tokenJwt: token.wali,
    });
    assert.strictEqual(res.status, 403);
  });
});

/* ============================== FR-5 ============================== */
describe('FR-5 Dashboard wali santri', () => {
  test('BB-38 wali dapat melihat daftar anaknya sendiri', async () => {
    const res = await minta('GET', '/dashboard/wali/saya', { tokenJwt: token.wali });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    assert.ok(res.body.data.every((s) => s.nama));
  });

  test('BB-39 dashboard wali menampilkan nilai, predikat, dan data grafik', async () => {
    const res = await minta('GET', '/dashboard/wali/1', { tokenJwt: token.wali });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.santri.nama, 'Muhammad Faiz Ramadhan');
    assert.strictEqual(res.body.data.hasilTerbaru.predikat, 'Baik');
    assert.ok(res.body.data.perkembangan.garisGabungan.length > 0);
  });

  test('BB-40 wali tidak dapat membuka data anak orang lain (403)', async () => {
    const res = await minta('GET', '/dashboard/wali/2', { tokenJwt: token.wali });
    assert.strictEqual(res.status, 403);
  });

  test('BB-41 wali kedua tetap dapat membuka data anaknya sendiri', async () => {
    const res = await minta('GET', '/dashboard/wali/2', { tokenJwt: token.wali2 });
    assert.strictEqual(res.status, 200);
  });

  test('BB-42 dashboard admin menampilkan ringkasan dan distribusi predikat', async () => {
    const res = await minta('GET', '/dashboard/admin', { tokenJwt: token.admin });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.ringkasan.jumlahSantri >= 12);
    assert.ok(Array.isArray(res.body.data.distribusiPredikat));
  });

  test('BB-43 dashboard ustadz menampilkan kelas yang diampu', async () => {
    const res = await minta('GET', '/dashboard/ustadz', { tokenJwt: token.ustadz });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.kelas.length >= 1);
  });
});

/* ============================== FR-6 ============================== */
describe('FR-6 Grafik perkembangan', () => {
  test('BB-44 data tren per pertemuan tersedia untuk wali', async () => {
    const res = await minta('GET', `/nilai/perkembangan/1?periode=${encodeURIComponent(PERIODE)}`, {
      tokenJwt: token.wali,
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.detailPerKriteria.length > 0);
  });

  test('BB-45 filter kelompok akademik hanya mengembalikan kriteria akademik', async () => {
    const res = await minta(
      'GET',
      `/nilai/perkembangan/1?periode=${encodeURIComponent(PERIODE)}&jenis=akademik`,
      { tokenJwt: token.wali }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.detailPerKriteria.every((t) => t.kelompok === 'akademik'));
    assert.ok(res.body.data.detailPerKriteria.length > 0);
  });

  test('BB-46 wali tidak dapat membuka tren anak orang lain (403)', async () => {
    const res = await minta('GET', '/nilai/perkembangan/2', { tokenJwt: token.wali });
    assert.strictEqual(res.status, 403);
  });
});

/* ============================== FR-7 ============================== */
describe('FR-7 Cetak rapor PDF', () => {
  test('BB-47 wali dapat mengunduh PDF rapor anaknya', async () => {
    const res = await minta('GET', `/rapor/1/pdf?periode=${encodeURIComponent(PERIODE)}`, {
      tokenJwt: token.wali,
      responseType: 'buffer',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
    assert.strictEqual(res.buffer.subarray(0, 5).toString(), '%PDF-');
    assert.ok(res.buffer.length > 1000, 'Ukuran PDF terlalu kecil');
  });

  test('BB-48 wali tidak dapat mengunduh rapor anak orang lain (403)', async () => {
    const res = await minta('GET', `/rapor/2/pdf?periode=${encodeURIComponent(PERIODE)}`, {
      tokenJwt: token.wali,
      responseType: 'buffer',
    });
    assert.strictEqual(res.status, 403);
  });

  test('BB-49 cetak PDF tanpa parameter periode ditolak dengan 422', async () => {
    const res = await minta('GET', '/rapor/1/pdf', { tokenJwt: token.admin });
    assert.strictEqual(res.status, 422);
  });

  test('BB-50 pratinjau JSON rapor memuat nilai akhir dan predikat', async () => {
    const res = await minta('GET', `/rapor/1/data?periode=${encodeURIComponent(PERIODE)}`, {
      tokenJwt: token.admin,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.nilaiAkhir, 0.7975);
    assert.strictEqual(res.body.data.predikat, 'Baik');
    assert.strictEqual(res.body.data.kriteria.length, 5);
  });
});

/* ========================== Keamanan umum ========================= */
describe('Keamanan dan penanganan galat', () => {
  test('BB-51 endpoint tidak dikenal menghasilkan 404', async () => {
    const res = await minta('GET', '/tidak-ada-endpoint-ini', { tokenJwt: token.admin });
    assert.strictEqual(res.status, 404);
  });

  test('BB-52 body JSON rusak menghasilkan 400', async () => {
    const res = await fetch(`${API}/santri`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.admin}` },
      body: '{ json rusak',
    });
    assert.strictEqual(res.status, 400);
  });

  test('BB-53 password tidak pernah dikembalikan dalam respons', async () => {
    const res = await minta('GET', '/users', { tokenJwt: token.admin });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.every((u) => u.password === undefined));
  });

  test('BB-54 total bobot kriteria dapat diubah lalu dikembalikan', async () => {
    const before = await minta('GET', '/nilai/kriteria', { tokenJwt: token.admin });
    const asli = before.body.data.find((k) => k.kode === 'C1');

    const ubah = await minta('PUT', `/nilai/kriteria/${asli.id}`, {
      tokenJwt: token.admin,
      body: { kode: 'C1', nama: asli.nama, bobot: 0.35, jenis: 'benefit' },
    });
    assert.strictEqual(ubah.status, 200);

    const cek = await minta('GET', '/saw/kriteria', { tokenJwt: token.admin });
    assert.strictEqual(cek.body.data.valid, false, 'Bobot total 1.15 seharusnya tidak valid');

    const kembalikan = await minta('PUT', `/nilai/kriteria/${asli.id}`, {
      tokenJwt: token.admin,
      body: { kode: 'C1', nama: asli.nama, bobot: Number(asli.bobot), jenis: asli.jenis },
    });
    assert.strictEqual(kembalikan.status, 200);

    const final = await minta('GET', '/saw/kriteria', { tokenJwt: token.admin });
    assert.strictEqual(final.body.data.valid, true);
  });
});
