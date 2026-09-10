const raporService = require('../services/rapor.service');
const { success, fail } = require('../utils/response');

/**
 * GET /api/v1/rapor/:idSantri/pdf?periode=... — FR-7
 * Menghasilkan file PDF rapor dan mengirimkannya sebagai unduhan.
 */
const cetakPdf = async (req, res, next) => {
  try {
    const { idSantri } = req.params;
    const { periode } = req.query;
    if (!periode) {
      return fail(res, { message: 'Parameter periode wajib diisi (contoh: ?periode=Ganjil 2025/2026).', statusCode: 422 });
    }

    const { doc, data } = await raporService.buatPdfRapor({ idSantri, periode });

    const namaFile = `Rapor-${data.santri.nama.replace(/\s+/g, '-')}-${periode.replace(/\s+/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(namaFile)}"`);
    res.setHeader('X-Nama-File', encodeURIComponent(namaFile));

    doc.pipe(res);
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/v1/rapor/:idSantri/data?periode=...
 * Versi JSON dari isi rapor — dipakai halaman pratinjau rapor di frontend.
 */
const dataRapor = async (req, res, next) => {
  try {
    const { idSantri } = req.params;
    const { periode } = req.query;
    if (!periode) {
      return fail(res, { message: 'Parameter periode wajib diisi.', statusCode: 422 });
    }
    const data = await raporService.kumpulkanDataRapor({ idSantri, periode });
    return success(res, {
      data: {
        santri: {
          nis: data.santri.nis,
          nama: data.santri.nama,
          tempatLahir: data.santri.tempat_lahir,
          tanggalLahir: data.santri.tanggal_lahir,
          jenisKelamin: data.santri.jenis_kelamin,
          kelas: data.santri.kelas?.nama_kelas || '-',
          wali: data.santri.wali?.nama || '-',
        },
        periode: data.periode,
        kriteria: data.kriteria.map((k) => ({
          kode: k.kode,
          nama: k.nama,
          bobot: Number(k.bobot),
          jenis: k.jenis,
          nilai: data.matriksX[k.kode],
          normalisasi: data.matriksR[k.kode],
          kontribusi: data.kontribusi[k.kode],
        })),
        nilaiAkhir: data.nilaiAkhir,
        nilaiSkala100: Number((data.nilaiAkhir * 100).toFixed(2)),
        predikat: data.predikat,
        tren: data.tren,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { cetakPdf, dataRapor };
