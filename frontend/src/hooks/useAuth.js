import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/** Akses state autentikasi dari komponen mana pun. */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>.');
  }
  return context;
};

export default useAuth;
