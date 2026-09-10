import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { PALET_GRAFIK } from '../../utils/constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const OPSI_SUMBU_Y = {
  min: 0,
  max: 100,
  ticks: { stepSize: 20 },
  title: { display: true, text: 'Skor (0-100)' },
};

/**
 * FR-6 — Grafik tren nilai santri.
 * `data` berbentuk keluaran endpoint /nilai/perkembangan/:idSantri.
 */
export const GrafikGaris = ({ data, judul = 'Tren Nilai per Pertemuan' }) => {
  const config = useMemo(() => {
    const titik = data?.detailPerKriteria || [];
    const label = [...new Set(titik.map((t) => `Pertemuan ${t.pertemuanKe}`))];
    const kodeUnik = [...new Set(titik.map((t) => t.kode))];

    return {
      data: {
        labels: label.length ? label : ['Belum ada data'],
        datasets: kodeUnik.map((kode, i) => {
          const seri = titik.filter((t) => t.kode === kode);
          return {
            label: `${kode} ${seri[0]?.namaKriteria || ''}`.trim(),
            data: label.map((l) => {
              const ketemu = seri.find((t) => `Pertemuan ${t.pertemuanKe}` === l);
              return ketemu ? ketemu.skor : null;
            }),
            borderColor: PALET_GRAFIK[i % PALET_GRAFIK.length],
            backgroundColor: `${PALET_GRAFIK[i % PALET_GRAFIK.length]}22`,
            tension: 0.3,
            spanGaps: true,
            pointRadius: 4,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          title: { display: Boolean(judul), text: judul, font: { size: 13 } },
        },
        scales: { y: OPSI_SUMBU_Y },
      },
    };
  }, [data, judul]);

  if (!data?.detailPerKriteria?.length) {
    return <div className="kosong">Belum ada data nilai untuk digambarkan.</div>;
  }

  return (
    <div style={{ height: 300 }}>
      <Line data={config.data} options={config.options} />
    </div>
  );
};

/** Grafik garis tunggal untuk nilai gabungan seluruh kriteria. */
export const GrafikGabungan = ({ garis = [], judul = 'Rata-rata Nilai Seluruh Kriteria' }) => {
  if (!garis.length) return <div className="kosong">Belum ada data nilai gabungan.</div>;

  return (
    <div style={{ height: 260 }}>
      <Line
        data={{
          labels: garis.map((g) => g.label),
          datasets: [
            {
              label: 'Rata-rata skor',
              data: garis.map((g) => g.skor),
              borderColor: PALET_GRAFIK[0],
              backgroundColor: 'rgba(27,94,32,0.15)',
              fill: true,
              tension: 0.3,
              pointRadius: 5,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: Boolean(judul), text: judul, font: { size: 13 } },
          },
          scales: { y: OPSI_SUMBU_Y },
        }}
      />
    </div>
  );
};

/** Grafik batang rata-rata skor per kriteria. */
export const GrafikBatangKriteria = ({ perKriteria = [] }) => {
  if (!perKriteria.length) return <div className="kosong">Belum ada data per kriteria.</div>;

  return (
    <div style={{ height: 260 }}>
      <Bar
        data={{
          labels: perKriteria.map((k) => `${k.kode} ${k.nama}`),
          datasets: [
            {
              label: 'Rata-rata skor',
              data: perKriteria.map((k) => k.skor),
              backgroundColor: perKriteria.map((_, i) => PALET_GRAFIK[i % PALET_GRAFIK.length]),
              borderRadius: 5,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: OPSI_SUMBU_Y, x: { ticks: { font: { size: 10 } } } },
        }}
      />
    </div>
  );
};

/** Grafik radar perbandingan capaian tiap kriteria. */
export const GrafikRadar = ({ perKriteria = [] }) => {
  if (!perKriteria.length) return <div className="kosong">Belum ada data per kriteria.</div>;

  return (
    <div style={{ height: 280 }}>
      <Radar
        data={{
          labels: perKriteria.map((k) => `${k.kode} ${k.nama}`),
          datasets: [
            {
              label: 'Capaian',
              data: perKriteria.map((k) => k.skor),
              borderColor: PALET_GRAFIK[0],
              backgroundColor: 'rgba(27,94,32,0.2)',
              pointBackgroundColor: PALET_GRAFIK[0],
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { r: { min: 0, max: 100, ticks: { stepSize: 20, font: { size: 9 } } } },
        }}
      />
    </div>
  );
};

export default GrafikGaris;
