import { useState, useCallback } from 'react';
import sawApi from '../api/sawApi';
import { pesanGalat } from '../api/axiosInstance';

/**
 * Hook untuk memicu perhitungan SAW (FR-4) dan membaca hasilnya.
 */
export const useSAW = () => {
  const [hasil, setHasil] = useState(null);
  const [kriteria, setKriteria] = useState(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState(null);

  const muatKriteria = useCallback(async () => {
    try {
      const { data } = await sawApi.kriteria();
      setKriteria(data.data);
      return data.data;
    } catch (error) {
      setGalat(pesanGalat(error));
      return null;
    }
  }, []);

  const hitungSantri = useCallback(async (idSantri, params = {}) => {
    setMemuat(true);
    setGalat(null);
    try {
      const { data } = await sawApi.hitungSantri(idSantri, params);
      setHasil(data.data);
      return { sukses: true, pesan: data.message, data: data.data };
    } catch (error) {
      const pesan = pesanGalat(error);
      setGalat(pesan);
      return { sukses: false, pesan };
    } finally {
      setMemuat(false);
    }
  }, []);

  const hitungKelas = useCallback(async (idKelas, params = {}) => {
    setMemuat(true);
    setGalat(null);
    try {
      const { data } = await sawApi.hitungKelas(idKelas, params);
      setHasil(data.data);
      return { sukses: true, pesan: data.message, data: data.data };
    } catch (error) {
      const pesan = pesanGalat(error);
      setGalat(pesan);
      return { sukses: false, pesan };
    } finally {
      setMemuat(false);
    }
  }, []);

  const ambilPeringkat = useCallback(async (idKelas, params = {}) => {
    setMemuat(true);
    setGalat(null);
    try {
      const { data } = await sawApi.peringkat(idKelas, params);
      return { sukses: true, data: data.data };
    } catch (error) {
      const pesan = pesanGalat(error);
      setGalat(pesan);
      return { sukses: false, pesan, data: [] };
    } finally {
      setMemuat(false);
    }
  }, []);

  return {
    hasil,
    kriteria,
    memuat,
    galat,
    muatKriteria,
    hitungSantri,
    hitungKelas,
    ambilPeringkat,
    bersihkan: () => {
      setHasil(null);
      setGalat(null);
    },
  };
};

export default useSAW;
