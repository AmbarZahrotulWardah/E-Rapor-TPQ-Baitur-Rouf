const config = require('../config/env');
const {
  JENIS_KRITERIA,
  BASIS_NORMALISASI,
  RENTANG_PREDIKAT,
  SKALA_PENUH,
} = require('../utils/constants');

/**
 * ============================================================
 *  SERVICE SAW — Simple Additive Weighting (FR-4)
 *  Implementasi Vault/ai.md §3 (notasi matematis) dan §5 (pseudocode).
 *
 *  Seluruh fungsi di file ini bersifat *pure* (tidak menyentuh database)
 *  kecuali `hitungDanSimpan`, sehingga mudah diuji unit dan dibandingkan
 *  dengan perhitungan manual (Vault/ai.md §7).
 * ============================================================
 */

/** Jumlah digit pembulatan output. */
const DIGIT = 6;

const bulatkan = (angka, digit = DIGIT) => {
  const faktor = 10 ** digit;
  return Math.round((Number(angka) + Number.EPSILON) * faktor) / faktor;
};

/**
 * Validasi total bobot kriteria harus sama dengan 1 (syarat mutlak SAW).
 * @throws {Error} bila selisih total bobot terhadap 1 melebihi toleransi.
 */
function validasiTotalBobot(kriteriaList, toleransi = config.saw.bobotTolerance) {
  if (!Array.isArray(kriteriaList) || kriteriaList.length === 0) {
    throw Object.assign(new Error('Daftar kriteria kosong, perhitungan SAW tidak dapat dilakukan.'), {
      statusCode: 422,
    });
  }
  const total = kriteriaList.reduce((acc, k) => acc + Number(k.bobot), 0);
  if (Math.abs(total - 1) > toleransi) {
    throw Object.assign(
      new Error(
        `Total bobot kriteria harus sama dengan 1. Total saat ini ${bulatkan(total, 4)}. ` +
          'Perbaiki bobot pada menu Kelola Kriteria.'
      ),
      { statusCode: 422 }
    );
  }
  return bulatkan(total, 4);
}

/**
 * Langkah 1 — membentuk Matriks Keputusan X.
 * Input `nilaiMentah` berbentuk { [idSantri]: { [kodeKriteria]: skor } }.
 * @returns {{ matriksX: Object, santriTanpaNilai: number[] }}
 */
function bentukMatriksKeputusan(nilaiMentah, kriteriaList) {
  const matriksX = {};
  const santriTanpaNilai = [];

  Object.entries(nilaiMentah).forEach(([idSantri, perKriteria]) => {
    const baris = {};
    let adaNilai = false;
    kriteriaList.forEach((k) => {
      const nilai = perKriteria[k.kode];
      const angka = nilai === undefined || nilai === null ? null : Number(nilai);
      if (angka !== null && !Number.isNaN(angka)) adaNilai = true;
      baris[k.kode] = angka;
    });
    matriksX[idSantri] = baris;
    if (!adaNilai) santriTanpaNilai.push(Number(idSantri));
  });

  return { matriksX, santriTanpaNilai };
}

/**
 * Menentukan pembagi normalisasi tiap kriteria.
 * - basis SKALA_PENUH  → pembagi tetap = skala penilaian maksimum (100).
 * - basis ANTAR_SANTRI → pembagi = max (benefit) atau min (cost) antar santri.
 */
function hitungPembagiNormalisasi(matriksX, kriteriaList, basis) {
  const pembagi = {};
  kriteriaList.forEach((k) => {
    const kolom = Object.values(matriksX)
      .map((baris) => baris[k.kode])
      .filter((v) => v !== null && !Number.isNaN(v));

    if (basis === BASIS_NORMALISASI.SKALA_PENUH) {
      pembagi[k.kode] = {
        jenis: k.jenis,
        nilai: SKALA_PENUH,
        sumber: `Skala penuh penilaian (${SKALA_PENUH})`,
      };
      return;
    }

    if (kolom.length === 0) {
      pembagi[k.kode] = { jenis: k.jenis, nilai: null, sumber: 'Tidak ada data nilai' };
      return;
    }

    const max = Math.max(...kolom);
    const min = Math.min(...kolom);
    pembagi[k.kode] =
      k.jenis === JENIS_KRITERIA.COST
        ? { jenis: k.jenis, nilai: min, sumber: 'Nilai minimum antar santri' }
        : { jenis: k.jenis, nilai: max, sumber: 'Nilai maksimum antar santri' };
  });
  return pembagi;
}

/**
 * Langkah 2 — Normalisasi matriks keputusan (R).
 *   benefit : r_ij = x_ij / max(x_ij)
 *   cost    : r_ij = min(x_ij) / x_ij
 * Nilai kosong dianggap 0 agar tidak merusak penjumlahan.
 */
function normalisasiMatriks(matriksX, kriteriaList, basis = BASIS_NORMALISASI.SKALA_PENUH) {
  const pembagi = hitungPembagiNormalisasi(matriksX, kriteriaList, basis);
  const matriksR = {};

  Object.entries(matriksX).forEach(([idSantri, baris]) => {
    const hasil = {};
    kriteriaList.forEach((k) => {
      const x = baris[k.kode];
      const p = pembagi[k.kode];
      let r = 0;

      if (x !== null && p.nilai !== null && p.nilai !== 0) {
        r = k.jenis === JENIS_KRITERIA.COST ? Number(p.nilai) / x : x / Number(p.nilai);
      }
      // Nilai cost dengan x = 0 tidak terdefinisi; diamankan menjadi 0.
      hasil[k.kode] = bulatkan(r);
    });
    matriksR[idSantri] = hasil;
  });

  return { matriksR, pembagi };
}

/**
 * Langkah 3 & 4 — Nilai preferensi Vi = Σ (w_j * r_ij).
 */
function hitungNilaiPreferensi(matriksR, kriteriaList) {
  const hasil = {};
  Object.entries(matriksR).forEach(([idSantri, baris]) => {
    let vi = 0;
    const kontribusi = {};
    kriteriaList.forEach((k) => {
      const bagian = Number(k.bobot) * baris[k.kode];
      kontribusi[k.kode] = bulatkan(bagian);
      vi += bagian;
    });
    hasil[idSantri] = { vi: bulatkan(vi), kontribusi };
  });
  return hasil;
}

/**
 * Langkah 5 — memetakan Vi ke predikat (Vault/ai.md §3.4).
 */
function mapViKePredikat(vi) {
  const nilai = Number(vi);
  const cocok = RENTANG_PREDIKAT.find((r) => nilai >= r.min);
  return (cocok || RENTANG_PREDIKAT[RENTANG_PREDIKAT.length - 1]).predikat;
}

/**
 * Memberi peringkat berdasarkan Vi terbesar. Santri dengan Vi sama
 * memperoleh peringkat yang sama (competition ranking: 1, 2, 2, 4).
 */
function beriPeringkat(hasilVi) {
  const urut = Object.entries(hasilVi).sort((a, b) => b[1].vi - a[1].vi);
  const peringkat = {};
  let posisi = 0;
  let viSebelumnya = null;
  urut.forEach(([idSantri, { vi }], index) => {
    if (viSebelumnya === null || vi !== viSebelumnya) {
      posisi = index + 1;
      viSebelumnya = vi;
    }
    peringkat[idSantri] = posisi;
  });
  return peringkat;
}

/**
 * Orkestrasi penuh perhitungan SAW untuk satu kelompok santri.
 * @param {Object} p
 * @param {Object} p.nilaiMentah      { [idSantri]: { [kodeKriteria]: skor } }
 * @param {Array}  p.kriteriaList     daftar kriteria aktif dari tabel `kriteria`
 * @param {string} [p.basis]          BASIS_NORMALISASI
 * @param {string} p.periode
 * @returns {Object} hasil lengkap termasuk jejak perhitungan
 */
function hitungSAW({ nilaiMentah, kriteriaList, basis = BASIS_NORMALISASI.SKALA_PENUH, periode }) {
  const totalBobot = validasiTotalBobot(kriteriaList);
  const { matriksX, santriTanpaNilai } = bentukMatriksKeputusan(nilaiMentah, kriteriaList);

  if (Object.keys(matriksX).length === 0) {
    throw Object.assign(new Error(`Belum ada data nilai untuk periode "${periode}".`), {
      statusCode: 422,
    });
  }

  const { matriksR, pembagi } = normalisasiMatriks(matriksX, kriteriaList, basis);
  const hasilVi = hitungNilaiPreferensi(matriksR, kriteriaList);
  const peringkat = beriPeringkat(hasilVi);

  const daftar = Object.keys(matriksX).map((idSantri) => ({
    idSantri: Number(idSantri),
    periode,
    nilaiAkhir: hasilVi[idSantri].vi,
    predikat: mapViKePredikat(hasilVi[idSantri].vi),
    ranking: basis === BASIS_NORMALISASI.ANTAR_SANTRI ? peringkat[idSantri] : null,
    jejak: {
      matriksX: matriksX[idSantri],
      matriksR: matriksR[idSantri],
      kontribusi: hasilVi[idSantri].kontribusi,
    },
  }));

  daftar.sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);

  return {
    periode,
    basis,
    totalBobot,
    kriteria: kriteriaList.map((k) => ({
      kode: k.kode,
      nama: k.nama,
      bobot: Number(k.bobot),
      jenis: k.jenis,
      pembagiNormalisasi: pembagi[k.kode],
    })),
    hasil: daftar,
    santriTanpaNilai,
  };
}

/* ================================================================== *
 *  LAPISAN ORKESTRASI — mengambil data dari database, menjalankan
 *  perhitungan murni di atas, lalu menyimpan hasilnya ke `hasil_saw`.
 *  Model di-require secara lazy agar fungsi murni di atas tetap dapat
 *  diuji unit tanpa koneksi database.
 * ================================================================== */

/** Ambil kriteria aktif sebagai daftar kriteria SAW. */
async function ambilKriteriaAktif() {
  const { Kriteria } = require('../models');
  const rows = await Kriteria.findAll({ where: { aktif: true } });
  return rows.map((k) => ({
    id: k.id,
    kode: k.kode,
    nama: k.nama,
    bobot: Number(k.bobot),
    jenis: k.jenis,
    kelompok: k.kelompok,
  }));
}

/** Tentukan daftar santri yang ikut dihitung. */
async function tentukanSantri({ idSantri, idKelas }) {
  const { Santri } = require('../models');
  const where = {};
  if (idSantri) where.id = idSantri;
  if (idKelas) where.id_kelas = idKelas;
  const rows = await Santri.findAll({ where, attributes: ['id', 'nis', 'nama'] });
  return rows.map((r) => ({ id: r.id, nis: r.nis, nama: r.nama }));
}

/**
 * Hitung SAW lalu simpan ke tabel `hasil_saw` (Vault/flow.md §4 langkah 7).
 * Hasil periode yang sama ditimpa (upsert) agar tidak menumpuk.
 */
async function hitungDanSimpan({ idSantri, idKelas, periode, basis = BASIS_NORMALISASI.SKALA_PENUH }) {
  if (!periode) {
    throw Object.assign(new Error('Parameter periode wajib diisi.'), { statusCode: 422 });
  }

  const kriteriaList = await ambilKriteriaAktif();
  const santriList = await tentukanSantri({ idSantri, idKelas });
  if (santriList.length === 0) {
    throw Object.assign(new Error('Santri tidak ditemukan.'), { statusCode: 404 });
  }

  const nilaiService = require('./nilai.service');
  const nilaiMentah = await nilaiService.ambilRataRataPeriode({
    idSantriList: santriList.map((s) => s.id),
    periode,
  });

  const kosong = santriList.filter((s) => !nilaiMentah[s.id] || Object.keys(nilaiMentah[s.id]).length === 0);
  if (kosong.length === santriList.length) {
    throw Object.assign(
      new Error(`Belum ada data nilai untuk periode "${periode}" pada cakupan ini.`),
      { statusCode: 422 }
    );
  }

  const hasilHitung = hitungSAW({ nilaiMentah, kriteriaList, basis, periode });

  const { HasilSAW } = require('../models');
  const tersimpan = [];
  for (const item of hasilHitung.hasil) {
    // eslint-disable-next-line no-await-in-loop
    const [row] = await HasilSAW.upsert({
      id_santri: item.idSantri,
      periode,
      basis_normalisasi: basis,
      nilai_akhir: item.nilaiAkhir,
      predikat: item.predikat,
      ranking: item.ranking,
      total_bobot: hasilHitung.totalBobot,
      detail_normalisasi: {
        matriksX: item.jejak.matriksX,
        matriksR: item.jejak.matriksR,
        kontribusi: item.jejak.kontribusi,
        kriteria: hasilHitung.kriteria,
      },
      generated_at: new Date(),
    });
    const santri = santriList.find((s) => s.id === item.idSantri);
    tersimpan.push({ ...item, nis: santri?.nis, nama: santri?.nama, idHasilSaw: row?.id });
  }

  return {
    ...hasilHitung,
    hasil: tersimpan,
    santriTanpaNilai: kosong.map((s) => ({ id: s.id, nis: s.nis, nama: s.nama })),
  };
}

/** Ambil hasil SAW tersimpan untuk satu santri (dipakai dashboard & rapor). */
async function ambilHasilTersimpan(idSantri, periode = null) {
  const { HasilSAW } = require('../models');
  const where = { id_santri: idSantri };
  if (periode) where.periode = periode;
  return HasilSAW.findAll({ where, order: [['periode', 'DESC'], ['generated_at', 'DESC']] });
}

module.exports = {
  bulatkan,
  validasiTotalBobot,
  bentukMatriksKeputusan,
  hitungPembagiNormalisasi,
  normalisasiMatriks,
  hitungNilaiPreferensi,
  mapViKePredikat,
  beriPeringkat,
  hitungSAW,
  ambilKriteriaAktif,
  tentukanSantri,
  hitungDanSimpan,
  ambilHasilTersimpan,
  DIGIT,
};
