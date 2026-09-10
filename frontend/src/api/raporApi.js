import axiosInstance from './axiosInstance';

/** FR-7 — data rapor (pratinjau) dan tautan PDF. */
export const raporApi = {
  data: (idSantri, periode) => axiosInstance.get(`/rapor/${idSantri}/data`, { params: { periode } }),
  urlPdf: (idSantri, periode) => `/api/v1/rapor/${idSantri}/pdf?periode=${encodeURIComponent(periode)}`,
};

export default raporApi;
