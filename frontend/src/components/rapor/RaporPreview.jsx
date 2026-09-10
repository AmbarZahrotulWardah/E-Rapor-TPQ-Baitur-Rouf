import { formatTanggal, hitungUmur } from '../../utils/formatDate';
import { kelasBadgePredikat, teksRentangPredikat } from '../../utils/predikatHelper';

/**
 * FR-7 — Pratinjau rapor di layar sebelum diunduh sebagai PDF.
 * Susunannya mengikuti layout PDF yang dihasilkan backend.
 */
const RaporPreview = ({ data }) => {
  if (!data) return <div className="kosong">Pilih santri dan periode untuk melihat rapor.</div>;

  const { santri, periode, kriteria, nilaiAkhir, nilaiSkala100, predikat } = data;

  return (
    <div className="kartu" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="rapor-header">
        <h2>RAPOR PERKEMBANGAN SANTRI</h2>
        <p>TPQ BAITUR ROUF SURABAYA · Periode {periode}</p>
      </div>

      <div style={{ padding: '1.15rem 1.25rem' }}>
        {/* A. Identitas */}
        <h3 className="teks-hijau mb-1">A. Identitas Santri</h3>
        <div className="identitas-grid mb-2">
          <div className="baris"><span className="label">NIS</span><span className="nilai">{santri.nis}</span></div>
          <div className="baris"><span className="label">Nama Lengkap</span><span className="nilai">{santri.nama}</span></div>
          <div className="baris">
            <span className="label">Tempat, Tanggal Lahir</span>
            <span className="nilai">
              {santri.tempatLahir || '-'}, {formatTanggal(santri.tanggalLahir)} ({hitungUmur(santri.tanggalLahir)})
            </span>
          </div>
          <div className="baris">
            <span className="label">Jenis Kelamin</span>
            <span className="nilai">{santri.jenisKelamin === 'L' ? 'Laki-laki' : santri.jenisKelamin === 'P' ? 'Perempuan' : '-'}</span>
          </div>
          <div className="baris"><span className="label">Kelas</span><span className="nilai">{santri.kelas}</span></div>
          <div className="baris"><span className="label">Wali Santri</span><span className="nilai">{santri.wali}</span></div>
        </div>

        {/* B. Nilai per kriteria */}
        <h3 className="teks-hijau mb-1">B. Nilai per Kriteria</h3>
        <div className="tabel-wrap mb-2">
          <table className="tabel">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Kriteria</th>
                <th className="tengah">Bobot</th>
                <th className="tengah">Nilai (X)</th>
                <th className="tengah">Normalisasi (R)</th>
                <th className="tengah">Kontribusi (W×R)</th>
              </tr>
            </thead>
            <tbody>
              {kriteria.map((k) => (
                <tr key={k.kode}>
                  <td className="mono">{k.kode}</td>
                  <td>{k.nama}</td>
                  <td className="tengah mono">{Number(k.bobot).toFixed(2)}</td>
                  <td className="tengah mono">{k.nilai === null || k.nilai === undefined ? '-' : Number(k.nilai).toFixed(2)}</td>
                  <td className="tengah mono">{k.normalisasi === undefined ? '-' : Number(k.normalisasi).toFixed(4)}</td>
                  <td className="tengah mono">{k.kontribusi === undefined ? '-' : Number(k.kontribusi).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Nilai Preferensi (Vi)</td>
                <td className="tengah mono" colSpan={3}>{Number(nilaiAkhir).toFixed(6)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="teks-kecil teks-abu mt-0">
          Nilai (X) adalah rata-rata skor seluruh pertemuan pada periode ini. Normalisasi kriteria benefit:
          R = X / 100 (skala penuh penilaian).
        </p>

        {/* C. Hasil */}
        <h3 className="teks-hijau mb-1">C. Hasil Perhitungan SAW</h3>
        <div className="flex-tengah flex-bungkus mb-1" style={{ gap: '1.5rem' }}>
          <div>
            <div className="teks-kecil teks-abu">Nilai Preferensi (Vi)</div>
            <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{Number(nilaiAkhir).toFixed(6)}</div>
          </div>
          <div>
            <div className="teks-kecil teks-abu">Skala 0-100</div>
            <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{nilaiSkala100}</div>
          </div>
          <div>
            <div className="teks-kecil teks-abu mb-1">Predikat</div>
            <span className={`kotak-predikat ${kelasBadgePredikat(predikat)}`} style={{ fontSize: '1rem' }}>{predikat}</span>
          </div>
        </div>
        <p className="teks-kecil teks-abu">Rentang predikat: {teksRentangPredikat}</p>
      </div>
    </div>
  );
};

export default RaporPreview;
