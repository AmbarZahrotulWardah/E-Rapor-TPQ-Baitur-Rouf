const PDFDocument = require('pdfkit');
const { Santri, Kelas, User, Kriteria } = require('../models');
const sawService = require('./saw.service');
const nilaiService = require('./nilai.service');
const { mapViKePredikat, bulatkan } = require('./saw.service');
const { SKALA_PENUH } = require('../utils/constants');

const httpError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

/** Warna tema rapor. */
const WARNA = {
  hijau: '#1b5e20',
  hijauMuda: '#e8f5e9',
  abu: '#4b5563',
  garis: '#d1d5db',
  teks: '#111827',
};

/**
 * Mengumpulkan seluruh data yang dibutuhkan rapor (Vault/flow.md §6 langkah 1).
 */
const kumpulkanDataRapor = async ({ idSantri, periode }) => {
  const santri = await Santri.findByPk(idSantri, {
    include: [
      { model: Kelas, as: 'kelas', attributes: ['id', 'nama_kelas'] },
      { model: User, as: 'wali', attributes: ['id', 'nama', 'email'] },
    ],
  });
  if (!santri) throw httpError('Santri tidak ditemukan.', 404);

  const kriteria = await Kriteria.findAll({ where: { aktif: true } });
  // Catatan: tanda kurung wajib ada. Tanpa kurung, indexing [santri.id]
  // dievaluasi lebih dulu terhadap Promise sehingga hasilnya undefined.
  const seluruhRataRata = await nilaiService.ambilRataRataPeriode({
    idSantriList: [santri.id],
    periode,
  });
  const rataRata = seluruhRataRata[santri.id];

  if (!rataRata) {
    throw httpError(`Belum ada data nilai untuk santri ini pada periode "${periode}".`, 422);
  }

  // Perhitungan SAW ditampilkan di rapor memakai basis skala penuh.
  const hasil = sawService.hitungSAW({
    nilaiMentah: { [santri.id]: rataRata },
    kriteriaList: kriteria.map((k) => ({
      kode: k.kode, nama: k.nama, bobot: Number(k.bobot), jenis: k.jenis,
    })),
    basis: 'skala_penuh',
    periode,
  });

  const jejak = hasil.hasil[0];
  const tren = await nilaiService.ambilTrenPerkembangan({ idSantri: santri.id, periode });

  return {
    santri,
    kriteria,
    periode,
    nilaiAkhir: jejak.nilaiAkhir,
    predikat: jejak.predikat,
    matriksX: jejak.jejak.matriksX,
    matriksR: jejak.jejak.matriksR,
    kontribusi: jejak.jejak.kontribusi,
    tren,
  };
};

/* ------------------------------ Helper gambar ------------------------------ */

const garisPemisah = (doc, y) => {
  doc.moveTo(50, y).lineTo(545, y).strokeColor(WARNA.garis).lineWidth(0.7).stroke();
};

const gambarHeader = (doc, data) => {
  doc.rect(0, 0, 595.28, 96).fill(WARNA.hijau);
  doc.fillColor('#ffffff');
  doc.font('Helvetica-Bold').fontSize(17).text('RAPOR PERKEMBANGAN SANTRI', 50, 24, { align: 'center' });
  doc.font('Helvetica').fontSize(11).text('TPQ BAITUR ROUF SURABAYA', 50, 46, { align: 'center' });
  doc.fontSize(8.5).fillColor('#d7f0d9');
  doc.text('Sistem E-Rapor Digital Berbasis AI dengan Metode Simple Additive Weighting (SAW)', 50, 62, {
    align: 'center',
  });
  doc.fillColor(WARNA.teks).moveDown(2);
};

const gambarIdentitas = (doc, data) => {
  const { santri } = data;
  doc.font('Helvetica-Bold').fontSize(12).fillColor(WARNA.hijau).text('A. IDENTITAS SANTRI');
  doc.moveDown(0.3);

  const kolom = [
    ['NIS', santri.nis],
    ['Nama Lengkap', santri.nama],
    ['Tempat, Tanggal Lahir', `${santri.tempat_lahir || '-'}${santri.tanggal_lahir ? `, ${santri.tanggal_lahir}` : ''}`],
    ['Jenis Kelamin', santri.jenis_kelamin === 'L' ? 'Laki-laki' : santri.jenis_kelamin === 'P' ? 'Perempuan' : '-'],
    ['Kelas', santri.kelas?.nama_kelas || '-'],
    ['Wali Santri', santri.wali?.nama || '-'],
    ['Periode Penilaian', data.periode],
  ];

  doc.font('Helvetica').fontSize(9.5).fillColor(WARNA.teks);
  kolom.forEach(([label, nilai]) => {
    const y = doc.y;
    doc.text(label, 60, y, { width: 150 });
    doc.text(':', 208, y, { width: 8 });
    doc.text(String(nilai), 220, y, { width: 320 });
  });
  doc.moveDown(0.8);
};

const gambarTabelNilai = (doc, data) => {
  doc.font('Helvetica-Bold').fontSize(12).fillColor(WARNA.hijau).text('B. NILAI PER KRITERIA');
  doc.moveDown(0.3);

  const lebar = [40, 165, 55, 60, 65, 60, 40];
  const header = ['Kode', 'Kriteria', 'Bobot', 'Nilai (X)', 'Normalisasi', 'Kontribusi', 'R×W'];
  const xAwal = 50;
  let y = doc.y;

  // baris judul
  doc.rect(xAwal, y, lebar.reduce((a, b) => a + b, 0), 20).fill(WARNA.hijau);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
  let x = xAwal;
  header.forEach((h, i) => {
    doc.text(h, x + 3, y + 6, { width: lebar[i] - 6, align: i >= 2 ? 'center' : 'left' });
    x += lebar[i];
  });
  y += 20;

  doc.font('Helvetica').fontSize(8.5);
  data.kriteria.forEach((k, idx) => {
    const xVal = data.matriksX[k.kode];
    const rVal = data.matriksR[k.kode];
    const kontrib = data.kontribusi[k.kode];
    const isi = [
      k.kode,
      k.nama,
      Number(k.bobot).toFixed(2),
      xVal === null || xVal === undefined ? '-' : Number(xVal).toFixed(2),
      rVal === undefined ? '-' : Number(rVal).toFixed(4),
      kontrib === undefined ? '-' : Number(kontrib).toFixed(4),
      Number(k.bobot).toFixed(2),
    ];

    if (idx % 2 === 0) doc.rect(xAwal, y, lebar.reduce((a, b) => a + b, 0), 18).fill(WARNA.hijauMuda);
    doc.fillColor(WARNA.teks);
    let xx = xAwal;
    isi.forEach((teks, i) => {
      doc.text(String(teks), xx + 3, y + 5, { width: lebar[i] - 6, align: i >= 2 ? 'center' : 'left' });
      xx += lebar[i];
    });
    y += 18;
  });

  doc.rect(xAwal, y - 18, lebar.reduce((a, b) => a + b, 0), 18).strokeColor(WARNA.garis).lineWidth(0.5).stroke();
  doc.y = y + 8;
  doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(WARNA.abu);
  doc.text(
    'Keterangan: Nilai (X) = rata-rata skor seluruh pertemuan pada periode ini. ' +
      'Normalisasi benefit r = X / 100 (skala penuh). Kontribusi = bobot × normalisasi.',
    xAwal,
    doc.y,
    { width: 495 }
  );
  doc.moveDown(0.8);
};

const gambarHasil = (doc, data) => {
  doc.fillColor(WARNA.teks);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(WARNA.hijau).text('C. HASIL PERHITUNGAN SAW');
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(10).fillColor(WARNA.teks);
  doc.text(`Nilai Preferensi (Vi)   : ${data.nilaiAkhir.toFixed(6)}`, 60);
  doc.text(`Nilai Skala 0-100       : ${(data.nilaiAkhir * SKALA_PENUH).toFixed(2)}`, 60);
  doc.moveDown(0.4);

  const lebarKotak = 200;
  const y = doc.y;
  doc.rect(60, y, lebarKotak, 30).fillAndStroke(WARNA.hijau, WARNA.hijau);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14);
  doc.text(`Predikat: ${data.predikat}`, 60, y + 9, { width: lebarKotak, align: 'center' });
  doc.fillColor(WARNA.teks);
  doc.y = y + 42;

  doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(WARNA.abu);
  doc.text(
    'Rentang predikat: ≥ 0.85 Sangat Baik · 0.70–0.84 Baik · 0.55–0.69 Cukup · < 0.55 Kurang.',
    60,
    doc.y,
    { width: 495 }
  );
  doc.moveDown(0.8);
};

/** Grafik tren sederhana berbentuk garis (tanpa dependensi tambahan). */
const gambarGrafikTren = (doc, data) => {
  const poin = data.tren;
  doc.fillColor(WARNA.teks).font('Helvetica-Bold').fontSize(12).fillColor(WARNA.hijau);
  doc.text('D. GRAFIK PERKEMBANGAN NILAI');
  doc.moveDown(0.3);

  if (poin.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(WARNA.abu).text('Belum ada data perkembangan.', 60);
    doc.moveDown(1);
    return;
  }

  const xAwal = 70;
  const yAwal = doc.y + 4;
  const lebar = 460;
  const tinggi = 130;
  const yBawah = yAwal + tinggi;

  // sumbu & garis bantu
  doc.lineWidth(0.6).strokeColor(WARNA.garis);
  for (let v = 0; v <= 100; v += 20) {
    const y = yBawah - (v / 100) * tinggi;
    doc.moveTo(xAwal, y).lineTo(xAwal + lebar, y).stroke();
    doc.font('Helvetica').fontSize(7).fillColor(WARNA.abu).text(String(v), xAwal - 22, y - 3, { width: 18, align: 'right' });
  }
  doc.moveTo(xAwal, yAwal).lineTo(xAwal, yBawah).lineTo(xAwal + lebar, yBawah).strokeColor(WARNA.abu).stroke();

  // kelompokkan per kriteria
  const kelompok = {};
  poin.forEach((p) => {
    if (!kelompok[p.kode]) kelompok[p.kode] = { nama: p.namaKriteria, titik: [] };
    kelompok[p.kode].titik.push(p);
  });

  const palet = ['#1b5e20', '#0969da', '#bf8700', '#cf222e', '#6f42c1'];
  const semuaTanggal = [...new Set(poin.map((p) => `${p.tanggal}#${p.pertemuanKe}`))];

  Object.entries(kelompok).forEach(([kode, grup], idx) => {
    const warna = palet[idx % palet.length];
    doc.strokeColor(warna).lineWidth(1.4);
    const titik = grup.titik
      .slice()
      .sort((a, b) => semuaTanggal.indexOf(`${a.tanggal}#${a.pertemuanKe}`) - semuaTanggal.indexOf(`${b.tanggal}#${b.pertemuanKe}`));

    titik.forEach((p, i) => {
      const urut = semuaTanggal.indexOf(`${p.tanggal}#${p.pertemuanKe}`);
      const x = xAwal + (semuaTanggal.length === 1 ? lebar / 2 : (urut / (semuaTanggal.length - 1)) * lebar);
      const y = yBawah - (p.skor / 100) * tinggi;
      if (i === 0) doc.moveTo(x, y);
      else doc.lineTo(x, y);
    });
    doc.stroke();

    titik.forEach((p) => {
      const urut = semuaTanggal.indexOf(`${p.tanggal}#${p.pertemuanKe}`);
      const x = xAwal + (semuaTanggal.length === 1 ? lebar / 2 : (urut / (semuaTanggal.length - 1)) * lebar);
      const y = yBawah - (p.skor / 100) * tinggi;
      doc.circle(x, y, 2).fillAndStroke(warna, warna);
    });
  });

  // legenda
  let lx = xAwal;
  const ly = yBawah + 16;
  doc.font('Helvetica').fontSize(7);
  Object.entries(kelompok).forEach(([kode, grup], idx) => {
    const warna = palet[idx % palet.length];
    doc.rect(lx, ly, 10, 3).fillAndStroke(warna, warna);
    doc.fillColor(WARNA.teks).text(`${kode} ${grup.nama}`, lx + 14, ly - 3, { width: 110 });
    lx += 128;
    if (lx > 460) lx = xAwal;
  });

  doc.y = ly + 18;
};

const gambarFooter = (doc, data) => {
  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  });
  doc.font('Helvetica').fontSize(9).fillColor(WARNA.teks);
  doc.text(`Surabaya, ${tanggalCetak}`, 380, doc.y + 14, { width: 160, align: 'left' });
  doc.moveDown(2);
  doc.text('Kepala TPQ Baitur Rouf', 380, doc.y, { width: 160, align: 'left' });
  doc.moveDown(2.5);
  doc.font('Helvetica-Bold').text('( .............................. )', 380, doc.y, { width: 160, align: 'left' });

  doc.font('Helvetica').fontSize(7).fillColor(WARNA.abu);
  doc.text(
    'Dokumen ini dihasilkan otomatis oleh Sistem E-Rapor Digital TPQ Baitur Rouf. ' +
      'Nilai akhir dihitung dengan metode Simple Additive Weighting (SAW).',
    50,
    790,
    { width: 495, align: 'center' }
  );
};

/**
 * FR-7 — menghasilkan stream PDF rapor.
 * @returns {Promise<import('pdfkit')>} instance PDFKit yang siap di-pipe ke response
 */
const buatPdfRapor = async ({ idSantri, periode }) => {
  const data = await kumpulkanDataRapor({ idSantri, periode });

  const doc = new PDFDocument({ size: 'A4', margin: 50, info: {
    Title: `Rapor ${data.santri.nama} - ${periode}`,
    Author: 'TPQ Baitur Rouf Surabaya',
    Subject: 'Rapor Perkembangan Santri (Metode SAW)',
  } });

  gambarHeader(doc, data);
  doc.y = 118;
  gambarIdentitas(doc, data);
  garisPemisah(doc, doc.y);
  doc.moveDown(0.4);
  gambarTabelNilai(doc, data);
  garisPemisah(doc, doc.y);
  doc.moveDown(0.4);
  gambarHasil(doc, data);
  garisPemisah(doc, doc.y);
  doc.moveDown(0.4);
  gambarGrafikTren(doc, data);
  gambarFooter(doc, data);

  doc.end();
  return { doc, data };
};

module.exports = { buatPdfRapor, kumpulkanDataRapor };
