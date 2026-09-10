import { createContext } from 'react';

/**
 * Context autentikasi.
 * Berisi user yang sedang login beserta fungsi untuk masuk/keluar.
 * Penyedia nilainya ada di AuthProvider.jsx.
 */
export const AuthContext = createContext(null);

export default AuthContext;
