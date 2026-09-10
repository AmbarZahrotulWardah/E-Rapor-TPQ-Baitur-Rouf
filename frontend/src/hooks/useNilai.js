import { useState, useCallback } from 'react';
import nilaiApi from '../api/nilaiApi';
import { pesanGalat } from '../api/axiosInstance';

/**
 * Hook untuk operasi data nilai (FR-3).
 * Menyediakan status memuat/galat agar antarmuka dapat memberi umpan balik.
 */
export const useNilai = () => {
  const [daftarNilai, setDaftarNilai] = useState([]);
  const [periode, setPeriode] = useState([]);
  const [kriteria, setKriteria] = useState([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState(null);

  const muatNilai = useCallback(async (params = {}) => {
    setMemuat(true);
    setGalat(null);
    try {
      const { data } = await nilaiApi.daftar(params);
      setDaftarNilai(data.data);
      return data.data;
    } catch (error) {
      setGalat(pesanGalat(error));
      return [];
    } finally {
      setMemuat(false);
    }
  }, []);

  const muatPeriode = useCallback(async (params = {}) => {
    try {
      const { data } = await nilaiApi.daftarPeriode(params);
      setPeriode(data.data);
      return data.data;
    } catch (error) {
      setGalat(pesanGalat(error));
      return [];
    }
  }, []);

  const muatKriteria = useCallback(async () => {
    try {
      const { data } = await nilaiApi.daftarKriteria();
      setKriteria(data.data);
      return data.data;
    } catch (error) {
      setGalat(pesanGalat(error));
      return [];
    }
  }, []);

  const simpanBatch = useCallback(async (payload) => {
    setMemuat(true);
    setGalat(null);
    try {
      const { data } = await nilaiApi.tambahBatch(payload);
      return { sukses: true, pesan: data.message, data: data.data };
    } catch (error) {
      const pesan = pesanGalat(error);
      setGalat(pesan);
      return { sukses: false, pesan };
    } finally {
      setMemuat(false);
    }
  }, []);

  const hapus = useCallback(async (id) => {
    setGalat(null);
    try {
      await nilaiApi.hapus(id);
      setDaftarNilai((sebelum) => sebelum.filter((n) => n.id !== id));
      return { sukses: true };
    } catch (error) {
      const pesan = pesanGalat(error);
      setGalat(pesan);
      return { sukses: false, pesan };
    }
  }, []);

  return {
    daftarNilai,
    periode,
    kriteria,
    memuat,
    galat,
    muatNilai,
    muatPeriode,
    muatKriteria,
    simpanBatch,
    hapus,
    bersihkanGalat: () => setGalat(null),
  };
};

export default useNilai;
