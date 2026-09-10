import axiosInstance from './axiosInstance';

/** FR-1 — autentikasi dan pengelolaan akun. */
export const authApi = {
  login: (email, password) => axiosInstance.post('/auth/login', { email, password }),
  me: () => axiosInstance.get('/auth/me'),
  ubahPassword: (passwordLama, passwordBaru) =>
    axiosInstance.put('/auth/password', { passwordLama, passwordBaru }),

  // Kelola akun (Admin)
  daftarUser: (params) => axiosInstance.get('/users', { params }),
  detailUser: (id) => axiosInstance.get(`/users/${id}`),
  tambahUser: (data) => axiosInstance.post('/users', data),
  ubahUser: (id, data) => axiosInstance.put(`/users/${id}`, data),
  hapusUser: (id) => axiosInstance.delete(`/users/${id}`),
};

export default authApi;
