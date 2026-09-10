import axiosInstance from './axiosInstance';

/** FR-3 — input nilai per kriteria per pertemuan, serta kriteria SAW. */
export const nilaiApi = {
  daftar: (params) => axiosInstance.get('/nilai', { params }),
  tambah: (data) => axiosInstance.post('/nilai', data),
  tambahBatch: (data) => axiosInstance.post('/nilai/batch', data),
  ubah: (id, data) => axiosInstance.put(`/nilai/${id}`, data),
  hapus: (id) => axiosInstance.delete(`/nilai/${id}`),

  perkembangan: (idSantri, params) => axiosInstance.get(`/nilai/perkembangan/${idSantri}`, { params }),
  daftarPeriode: (params) => axiosInstance.get('/nilai/periode', { params }),

  daftarKriteria: (params) => axiosInstance.get('/nilai/kriteria', { params }),
  tambahKriteria: (data) => axiosInstance.post('/nilai/kriteria', data),
  ubahKriteria: (id, data) => axiosInstance.put(`/nilai/kriteria/${id}`, data),
  hapusKriteria: (id) => axiosInstance.delete(`/nilai/kriteria/${id}`),
};

export default nilaiApi;
