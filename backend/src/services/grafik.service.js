const { fn, col } = require('sequelize');
const { Santri, Kelas, User, Nilai, HasilSAW, Kriteria } = require('../models');
const nilaiService = require('./nilai.service');
const sawService = require('./saw.service');

const httpError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

/**
 * FR-6 — data grafik perkembangan satu santri.
 * Menyediakan dua bentuk data agar frontend dapat memilih:
 * per pertemuan (line chart) dan per kriteria (radar/bar chart).
 */
const dataPerkembanganSantri = async ({ idSantri, periode, jenis = 'semua' }) => {
  const tren = await nilaiService.ambilTrenPerkembangan({ idSantri, periode });
  const difilter = jenis === 'semua' ? tren : tren.filter((t) => t.kelompok === jenis);

  const perPertemuan = {};
  difilter.forEach((t) => {
    const key = `Pertemuan ${t.pertemuanKe}`;
    if (!perPertemuan[key]) perPertemuan[key] = { label: key, tanggal: t.tanggal, total: 0, jumlah: 0 };
    perPertemuan[key].total += t.skor;
    perPertemuan[key].jumlah += 1;
  });

  const garisGabungan = Object.values(perPertemuan).map((p) => ({
    label: p.label,
    tanggal: p.tanggal,
    skor: Number((p.total / p.jumlah).toFixed(2)),
  }));

  const perKriteriaMap = {};
  difilter.forEach((t) => {
    if (!perKriteriaMap[t.kode]) perKriteriaMap[t.kode] = { kode: t.kode, nama: t.namaKriteria, total: 0, jumlah: 0 };
    perKriteriaMap[t.kode].total += t.skor;
    perKriteriaMap[t.kode].jumlah += 1;
  });

  const perKriteria = Object.values(perKriteriaMap).map((k) => ({
    kode: k.kode,
    nama: k.nama,
    skor: Number((k.total / k.jumlah).toFixed(2)),
  }));

  return {
    idSantri,
    periode: periode || null,
    jenisFilter: jenis,
    garisGabungan,
    perKriteria,
    detailPerKriteria: difilter,
  };
};

/**
 * FR-5 — isi dashboard wali santri.
 * Hanya menampilkan data anak yang terhubung dengan akun wali tersebut.
 */
const dashboardWali = async (idSantri) => {
  const santri = await Santri.findByPk(idSantri, {
    include: [
      { model: Kelas, as: 'kelas', attributes: ['id', 'nama_kelas'] },
      { model: User, as: 'wali', attributes: ['id', 'nama'] },
    ],
  });
  if (!santri) throw httpError('Data santri tidak ditemukan.', 404);

  const hasil = await sawService.ambilHasilTersimpan(idSantri);
  const daftarPeriode = await nilaiService.daftarPeriode();
  const periodeTerbaru = daftarPeriode[0]?.periode || null;

  const periodeAktif = hasil[0]?.periode || periodeTerbaru;
  const perkembangan = periodeAktif
    ? await dataPerkembanganSantri({ idSantri, periode: periodeAktif })
    : { garisGabungan: [], perKriteria: [], detailPerKriteria: [] };

  return {
    santri: {
      id: santri.id,
      nis: santri.nis,
      nama: santri.nama,
      tempatLahir: santri.tempat_lahir,
      tanggalLahir: santri.tanggal_lahir,
      jenisKelamin: santri.jenis_kelamin,
      kelas: santri.kelas?.nama_kelas || '-',
      ustadz: santri.kelas?.ustadz?.nama || null,
    },
    hasilTerbaru: hasil[0]
      ? {
          periode: hasil[0].periode,
          nilaiAkhir: Number(hasil[0].nilai_akhir),
          nilaiSkala100: Number((Number(hasil[0].nilai_akhir) * 100).toFixed(2)),
          predikat: hasil[0].predikat,
          ranking: hasil[0].ranking,
          generatedAt: hasil[0].generated_at,
        }
      : null,
    riwayatPeriode: hasil.map((h) => ({
      periode: h.periode,
      nilaiAkhir: Number(h.nilai_akhir),
      nilaiSkala100: Number((Number(h.nilai_akhir) * 100).toFixed(2)),
      predikat: h.predikat,
      basisNormalisasi: h.basis_normalisasi,
    })),
    perkembangan,
    daftarPeriode: daftarPeriode.map((p) => p.periode),
  };
};

/** Dashboard admin: ringkasan jumlah data + distribusi predikat. */
const dashboardAdmin = async () => {
  const [jumlahSantri, jumlahKelas, jumlahUstadz, jumlahWali, jumlahNilai] = await Promise.all([
    Santri.count(),
    Kelas.count(),
    User.count({ where: { role: 'ustadz' } }),
    User.count({ where: { role: 'wali_santri' } }),
    Nilai.count(),
  ]);

  const distribusi = await HasilSAW.findAll({
    attributes: ['predikat', [fn('COUNT', col('id')), 'jumlah']],
    group: ['predikat'],
    raw: true,
  });

  const perKelas = await Santri.findAll({
    attributes: ['id_kelas', [fn('COUNT', col('Santri.id')), 'jumlah']],
    include: [{ model: Kelas, as: 'kelas', attributes: ['nama_kelas'] }],
    group: ['id_kelas', 'kelas.nama_kelas'],
    raw: true,
    nest: true,
  });

  return {
    ringkasan: {
      jumlahSantri, jumlahKelas, jumlahUstadz, jumlahWali, jumlahNilai,
      jumlahHasilSaw: await HasilSAW.count(),
    },
    distribusiPredikat: distribusi.map((d) => ({ predikat: d.predikat, jumlah: Number(d.jumlah) })),
    santriPerKelas: perKelas.map((k) => ({
      kelas: k.kelas?.nama_kelas || 'Tanpa Kelas',
      jumlah: Number(k.jumlah),
    })),
  };
};

/** Dashboard ustadz: kelas yang diampu beserta progres input nilai. */
const dashboardUstadz = async (idUstadz) => {
  const kelasDiampu = await Kelas.findAll({ where: { id_ustadz: idUstadz } });
  const semuaKelas = kelasDiampu.length > 0 ? kelasDiampu : await Kelas.findAll();

  const daftarKelas = [];
  for (const k of semuaKelas) {
    // eslint-disable-next-line no-await-in-loop
    const santriList = await Santri.findAll({ where: { id_kelas: k.id } });
    // eslint-disable-next-line no-await-in-loop
    const totalNilai = await Nilai.count({ where: { id_santri: santriList.map((s) => s.id) } });
    daftarKelas.push({
      id: k.id,
      namaKelas: k.nama_kelas,
      jumlahSantri: santriList.length,
      totalNilaiDiinput: totalNilai,
      diampuSendiri: k.id_ustadz === idUstadz,
    });
  }

  const periode = await nilaiService.daftarPeriode();

  return {
    kelas: daftarKelas,
    totalSantri: daftarKelas.reduce((a, k) => a + k.jumlahSantri, 0),
    totalNilaiDiinput: daftarKelas.reduce((a, k) => a + k.totalNilaiDiinput, 0),
    daftarPeriode: periode.map((p) => p.periode),
  };
};

module.exports = { dataPerkembanganSantri, dashboardWali, dashboardAdmin, dashboardUstadz };
