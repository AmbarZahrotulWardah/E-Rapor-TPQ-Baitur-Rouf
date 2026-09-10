/**
 * Unit Test Algoritma SAW
 * Acuan: Vault/ai.md §7 butir 1 (strategi pengujian algoritma).
 *
 * Dijalankan dengan: npm run test:unit
 * Seluruh pengujian memakai fungsi murni di saw.service.js sehingga
 * tidak memerlukan koneksi database.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');

const saw = require('../../src/services/saw.service');
const { BASIS_NORMALISASI } = require('../../src/utils/constants');

/** Kriteria contoh dari Vault/ai.md §2 — total bobot 1.00. */
const KRITERIA = [
  { kode: 'C1', nama: 'Makhraj Huruf', bobot: 0.2, jenis: 'benefit' },
  { kode: 'C2', nama: 'Tajwid', bobot: 0.25, jenis: 'benefit' },
  { kode: 'C3', nama: 'Kelancaran Bacaan', bobot: 0.2, jenis: 'benefit' },
  { kode: 'C4', nama: 'Hafalan', bobot: 0.15, jenis: 'benefit' },
  { kode: 'C5', nama: 'Akademik (Tulis/Iqra)', bobot: 0.2, jenis: 'benefit' },
];

/** Contoh perhitungan manual dari Vault/ai.md §4. */
const SKOR_MANUAL = { C1: 80, C2: 85, C3: 75, C4: 90, C5: 70 };

describe('Validasi total bobot kriteria', () => {
  test('total bobot = 1 dinyatakan valid', () => {
    assert.strictEqual(saw.validasiTotalBobot(KRITERIA), 1);
  });

  test('total bobot kurang dari 1 harus menghasilkan galat', () => {
    assert.throws(
      () => saw.validasiTotalBobot([{ kode: 'C1', bobot: 0.5, jenis: 'benefit' }]),
      /Total bobot kriteria harus sama dengan 1/
    );
  });

  test('total bobot lebih dari 1 harus menghasilkan galat', () => {
    const berlebih = [
      { kode: 'C1', bobot: 0.6, jenis: 'benefit' },
      { kode: 'C2', bobot: 0.6, jenis: 'benefit' },
    ];
    assert.throws(() => saw.validasiTotalBobot(berlebih), /harus sama dengan 1/);
  });

  test('selisih sangat kecil karena floating point tetap diterima', () => {
    const hampirSatu = [
      { kode: 'C1', bobot: 0.1, jenis: 'benefit' },
      { kode: 'C2', bobot: 0.2, jenis: 'benefit' },
      { kode: 'C3', bobot: 0.3, jenis: 'benefit' },
      { kode: 'C4', bobot: 0.4, jenis: 'benefit' },
    ];
    assert.doesNotThrow(() => saw.validasiTotalBobot(hampirSatu));
  });

  test('daftar kriteria kosong harus menghasilkan galat', () => {
    assert.throws(() => saw.validasiTotalBobot([]), /Daftar kriteria kosong/);
  });
});

describe('Normalisasi matriks keputusan', () => {
  test('benefit dengan basis skala penuh: r = x / 100', () => {
    const { matriksR } = saw.normalisasiMatriks(
      { 1: SKOR_MANUAL },
      KRITERIA,
      BASIS_NORMALISASI.SKALA_PENUH
    );
    assert.deepStrictEqual(matriksR[1], { C1: 0.8, C2: 0.85, C3: 0.75, C4: 0.9, C5: 0.7 });
  });

  test('benefit dengan basis antar santri: pembagi = nilai maksimum', () => {
    const { matriksR, pembagi } = saw.normalisasiMatriks(
      { 1: { C1: 80 }, 2: { C1: 100 } },
      [{ kode: 'C1', bobot: 1, jenis: 'benefit' }],
      BASIS_NORMALISASI.ANTAR_SANTRI
    );
    assert.strictEqual(pembagi.C1.nilai, 100);
    assert.strictEqual(matriksR[1].C1, 0.8);
    assert.strictEqual(matriksR[2].C1, 1);
  });

  test('cost dengan basis antar santri: pembagi = nilai minimum', () => {
    const { matriksR, pembagi } = saw.normalisasiMatriks(
      { 1: { K: 20 }, 2: { K: 50 } },
      [{ kode: 'K', bobot: 1, jenis: 'cost' }],
      BASIS_NORMALISASI.ANTAR_SANTRI
    );
    assert.strictEqual(pembagi.K.nilai, 20);
    assert.strictEqual(matriksR[1].K, 1); // nilai terkecil mendapat nilai tertinggi
    assert.strictEqual(matriksR[2].K, 0.4);
  });

  test('nilai kosong diperlakukan sebagai 0 agar penjumlahan tidak rusak', () => {
    const { matriksR } = saw.normalisasiMatriks(
      { 1: { C1: 80, C2: null } },
      KRITERIA.slice(0, 2),
      BASIS_NORMALISASI.SKALA_PENUH
    );
    assert.strictEqual(matriksR[1].C1, 0.8);
    assert.strictEqual(matriksR[1].C2, 0);
  });
});

describe('Nilai preferensi dan predikat', () => {
  test('Vi sesuai perhitungan manual Vault/ai.md §4 (0.7975)', () => {
    const hasil = saw.hitungSAW({
      nilaiMentah: { 12: SKOR_MANUAL },
      kriteriaList: KRITERIA,
      basis: BASIS_NORMALISASI.SKALA_PENUH,
      periode: 'Ganjil 2025/2026',
    });
    assert.strictEqual(hasil.hasil[0].nilaiAkhir, 0.7975);
    assert.strictEqual(hasil.hasil[0].predikat, 'Baik');
    assert.strictEqual(hasil.hasil[0].idSantri, 12);
    assert.strictEqual(hasil.hasil[0].periode, 'Ganjil 2025/2026');
  });

  test('rincian kontribusi tiap kriteria dapat ditelusuri', () => {
    const hasil = saw.hitungSAW({
      nilaiMentah: { 1: SKOR_MANUAL },
      kriteriaList: KRITERIA,
      periode: 'Ganjil 2025/2026',
    });
    const kontribusi = hasil.hasil[0].jejak.kontribusi;
    assert.strictEqual(kontribusi.C1, 0.16);
    assert.strictEqual(kontribusi.C2, 0.2125);
    assert.strictEqual(kontribusi.C3, 0.15);
    assert.strictEqual(kontribusi.C4, 0.135);
    assert.strictEqual(kontribusi.C5, 0.14);
  });

  test('pemetaan Vi ke predikat sesuai rentang Vault/ai.md §3.4', () => {
    assert.strictEqual(saw.mapViKePredikat(0.95), 'Sangat Baik');
    assert.strictEqual(saw.mapViKePredikat(0.85), 'Sangat Baik'); // batas bawah inklusif
    assert.strictEqual(saw.mapViKePredikat(0.84), 'Baik');
    assert.strictEqual(saw.mapViKePredikat(0.7), 'Baik');
    assert.strictEqual(saw.mapViKePredikat(0.69), 'Cukup');
    assert.strictEqual(saw.mapViKePredikat(0.55), 'Cukup');
    assert.strictEqual(saw.mapViKePredikat(0.54), 'Kurang');
    assert.strictEqual(saw.mapViKePredikat(0), 'Kurang');
  });

  test('hasil bersifat deterministik untuk input yang sama', () => {
    const args = {
      nilaiMentah: { 1: SKOR_MANUAL, 2: { C1: 60, C2: 70, C3: 65, C4: 80, C5: 55 } },
      kriteriaList: KRITERIA,
      periode: 'Ganjil 2025/2026',
    };
    const pertama = saw.hitungSAW(args);
    const kedua = saw.hitungSAW(args);
    assert.deepStrictEqual(pertama.hasil, kedua.hasil);
  });
});

describe('Perhitungan multi santri dan peringkat', () => {
  test('santri dengan nilai lebih tinggi memperoleh Vi lebih besar', () => {
    const hasil = saw.hitungSAW({
      nilaiMentah: {
        1: { C1: 90, C2: 90, C3: 90, C4: 90, C5: 90 },
        2: { C1: 50, C2: 50, C3: 50, C4: 50, C5: 50 },
      },
      kriteriaList: KRITERIA,
      basis: BASIS_NORMALISASI.ANTAR_SANTRI,
      periode: 'Ganjil 2025/2026',
    });
    assert.strictEqual(hasil.hasil[0].idSantri, 1);
    assert.ok(hasil.hasil[0].nilaiAkhir > hasil.hasil[1].nilaiAkhir);
  });

  test('peringkat memakai pola kompetisi (1, 2, 2, 4) untuk nilai seri', () => {
    const peringkat = saw.beriPeringkat({
      a: { vi: 0.9 },
      b: { vi: 0.8 },
      c: { vi: 0.8 },
      d: { vi: 0.7 },
    });
    assert.deepStrictEqual(peringkat, { a: 1, b: 2, c: 2, d: 4 });
  });

  test('santri tanpa nilai dilaporkan terpisah, bukan dihitung', () => {
    const hasil = saw.hitungSAW({
      nilaiMentah: {
        1: SKOR_MANUAL,
        2: { C1: null, C2: null, C3: null, C4: null, C5: null },
      },
      kriteriaList: KRITERIA,
      periode: 'Ganjil 2025/2026',
    });
    assert.deepStrictEqual(hasil.santriTanpaNilai, [2]);
  });

  test('tidak ada data nilai sama sekali harus menghasilkan galat', () => {
    assert.throws(
      () => saw.hitungSAW({ nilaiMentah: {}, kriteriaList: KRITERIA, periode: 'Ganjil 2025/2026' }),
      /Belum ada data nilai/
    );
  });
});
