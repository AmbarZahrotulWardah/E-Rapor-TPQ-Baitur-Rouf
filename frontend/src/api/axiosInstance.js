import axios from 'axios';

/**
 * Instance axios terpusat.
 * `baseURL` memakai jalur relatif `/api/v1` sehingga permintaan diteruskan
 * oleh proxy Vite ke backend Express — tidak ada hardcode host.
 */
const axiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

const TOKEN_KEY = 'erapor_token';
const USER_KEY = 'erapor_user';

export const simpanSesi = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const ambilToken = () => localStorage.getItem(TOKEN_KEY);
export const ambilUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const hapusSesi = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/** Sisipkan token JWT ke setiap permintaan. */
axiosInstance.interceptors.request.use((config) => {
  const token = ambilToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Tangani sesi kedaluwarsa secara seragam. */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      hapusSesi();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/** Ekstrak pesan galat dari backend agar mudah ditampilkan ke pengguna. */
export const pesanGalat = (error) => {
  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
  return data?.message || error?.message || 'Terjadi kesalahan pada server.';
};

export default axiosInstance;
