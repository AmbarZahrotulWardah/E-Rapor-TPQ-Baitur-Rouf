import { useState, useCallback, useMemo } from 'react';
import AuthContext from './AuthContext';
import authApi from '../api/authApi';
import { ambilToken, ambilUser, simpanSesi, hapusSesi } from '../api/axiosInstance';
import { ROLES } from '../utils/constants';

/**
 * Menyediakan state autentikasi ke seluruh aplikasi.
 * Sesi disimpan di localStorage agar tetap bertahan saat halaman dimuat ulang.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => ambilUser());
  const [token, setToken] = useState(() => ambilToken());
  const [memuat, setMemuat] = useState(false);

  const login = useCallback(async (email, password) => {
    setMemuat(true);
    try {
      const { data } = await authApi.login(email, password);
      simpanSesi(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setMemuat(false);
    }
  }, []);

  const logout = useCallback(() => {
    hapusSesi();
    setToken(null);
    setUser(null);
  }, []);

  /** Pembaruan profil lokal setelah data akun diubah di server. */
  const perbaruiUser = useCallback((dataUser) => {
    setUser(dataUser);
    localStorage.setItem('erapor_user', JSON.stringify(dataUser));
  }, []);

  const nilai = useMemo(
    () => ({
      user,
      token,
      memuat,
      login,
      logout,
      perbaruiUser,
      sudahLogin: Boolean(token && user),
      adalahAdmin: user?.role === ROLES.ADMIN,
      adalahUstadz: user?.role === ROLES.USTADZ,
      adalahWali: user?.role === ROLES.WALI_SANTRI,
    }),
    [user, token, memuat, login, logout, perbaruiUser]
  );

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
