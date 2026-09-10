import axiosInstance, { ambilToken } from './axiosInstance';

/** FR-4 — perhitungan SAW & perangkingan. */
export const sawApi = {
  kriteria: () => axiosInstance.get('/saw/kriteria'),
  hitungSantri: (idSantri, params) => axiosInstance.get(`/saw/hitung/${idSantri}`, { params }),
  hitungKelas: (idKelas, params) => axiosInstance.get(`/saw/hitung-kelas/${idKelas}`, { params }),
  hitungSemua: (params) => axiosInstance.get('/saw/hitung-semua', { params }),
  hasil: (idSantri, params) => axiosInstance.get(`/saw/hasil/${idSantri}`, { params }),
  peringkat: (idKelas, params) => axiosInstance.get(`/saw/peringkat/${idKelas}`, { params }),
};

/** FR-7 — unduh PDF rapor (butuh responseType blob). */
export const unduhPdfRapor = async (idSantri, periode) => {
  const response = await axiosInstance.get(`/rapor/${idSantri}/pdf`, {
    params: { periode },
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement('a');
  tautan.href = url;
  tautan.download = decodeURIComponent(
    response.headers['x-nama-file'] || `Rapor-${idSantri}-${periode}.pdf`
  );
  document.body.appendChild(tautan);
  tautan.click();
  document.body.removeChild(tautan);
  URL.revokeObjectURL(url);
  return tautan.download;
};

/** Buka PDF di tab baru (dipakai tombol "Lihat Rapor"). */
export const bukaPdfRapor = (idSantri, periode) => {
  const token = ambilToken();
  // Token dikirim lewat query karena window.open tidak dapat menyetel header.
  const url = `/api/v1/rapor/${idSantri}/pdf?periode=${encodeURIComponent(periode)}&token=${encodeURIComponent(token)}`;
  window.open(url, '_blank');
};

export default sawApi;
