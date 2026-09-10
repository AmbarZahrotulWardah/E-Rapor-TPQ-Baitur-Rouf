import axiosInstance from './axiosInstance';

/** FR-5 & FR-6 — dashboard per role. */
export const dashboardApi = {
  admin: () => axiosInstance.get('/dashboard/admin'),
  ustadz: () => axiosInstance.get('/dashboard/ustadz'),
  anakSaya: () => axiosInstance.get('/dashboard/wali/saya'),
  wali: (idSantri) => axiosInstance.get(`/dashboard/wali/${idSantri}`),
};

export default dashboardApi;
