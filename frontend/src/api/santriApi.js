import axiosInstance from './axiosInstance';

/** FR-2 — data santri dan kelas. */
export const santriApi = {
  daftar: (params) => axiosInstance.get('/santri', { params }),
  detail: (id) => axiosInstance.get(`/santri/${id}`),
  tambah: (data) => axiosInstance.post('/santri', data),
  ubah: (id, data) => axiosInstance.put(`/santri/${id}`, data),
  hapus: (id) => axiosInstance.delete(`/santri/${id}`),

  daftarKelas: () => axiosInstance.get('/santri/kelas'),
  tambahKelas: (data) => axiosInstance.post('/santri/kelas', data),
  ubahKelas: (id, data) => axiosInstance.put(`/santri/kelas/${id}`, data),
  hapusKelas: (id) => axiosInstance.delete(`/santri/kelas/${id}`),
};

export default santriApi;
