/**
 * Seeder data contoh untuk lingkungan pengembangan & pengujian.
 *   npm run db:seed
 *
 * Data ini juga menjadi bahan pengujian "perbandingan hasil manual dengan
 * sistem" (Vault/ai.md §7 butir 2).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { sequelize, User, Kelas, Santri, Kriteria, Nilai, HasilSAW } = require('../src/models');
const config = require('../src/config/env');
const { KRITERIA_DEFAULT } = require('../src/utils/constants');

const PERIODE = 'Ganjil 2025/2026';
const hash = (plain) => bcrypt.hashSync(plain, config.bcryptSaltRounds);

const dataKelas = [
  { nama_kelas: 'Iqra 1', keterangan: 'Dasar pengenalan huruf hijaiyah' },
  { nama_kelas: 'Iqra 4', keterangan: 'Lanjutan bacaan bersambung' },
  { nama_kelas: 'Al-Quran Pemula', keterangan: 'Bacaan Al-Quran juz 30' },
];

const dataUser = [
  { nama: 'Admin TPQ Baitur Rouf', email: 'admin@tpqbaiturrouf.sch.id', password: 'admin123', role: 'admin' },
  { nama: 'Ustadz Ahmad Fauzi', email: 'ustadz1@tpqbaiturrouf.sch.id', password: 'ustadz123', role: 'ustadz' },
  { nama: 'Ustadzah Siti Aminah', email: 'ustadz2@tpqbaiturrouf.sch.id', password: 'ustadz123', role: 'ustadz' },
];

const dataWali = [
  { nama: 'Budi Santoso', email: 'wali1@tpqbaiturrouf.sch.id', password: 'wali123' },
  { nama: 'Rahmat Hidayat', email: 'wali2@tpqbaiturrouf.sch.id', password: 'wali123' },
  { nama: 'Nurhasanah', email: 'wali3@tpqbaiturrouf.sch.id', password: 'wali123' },
  { nama: ' Slamet Riyadi', email: 'wali4@tpqbaiturrouf.sch.id', password: 'wali123' },
  { nama: 'Fatimah Zahra', email: 'wali5@tpqbaiturrouf.sch.id', password: 'wali123' },
];

/** 12 santri: 4 per kelas. */
const dataSantri = [
  { nis: '2025001', nama: 'Muhammad Faiz Ramadhan', tempat_lahir: 'Surabaya', tanggal_lahir: '2016-03-12', jenis_kelamin: 'L', id_kelas: 1, id_wali: 1 },
  { nis: '2025002', nama: 'Aisyah Putri Handayani', tempat_lahir: 'Surabaya', tanggal_lahir: '2016-07-21', jenis_kelamin: 'P', id_kelas: 1, id_wali: 2 },
  { nis: '2025003', nama: 'Ahmad Zaki Mubarok', tempat_lahir: 'Sidoarjo', tanggal_lahir: '2015-11-05', jenis_kelamin: 'L', id_kelas: 1, id_wali: 3 },
  { nis: '2025004', nama: 'Khadijah Nur Aini', tempat_lahir: 'Surabaya', tanggal_lahir: '2016-01-30', jenis_kelamin: 'P', id_kelas: 1, id_wali: 4 },
  { nis: '2025005', nama: 'Umar Faruq Alfarizi', tempat_lahir: 'Gresik', tanggal_lahir: '2015-05-17', jenis_kelamin: 'L', id_kelas: 2, id_wali: 5 },
  { nis: '2025006', nama: 'Zahra Amelia Sari', tempat_lahir: 'Surabaya', tanggal_lahir: '2015-09-08', jenis_kelamin: 'P', id_kelas: 2, id_wali: 1 },
  { nis: '2025007', nama: 'Bilal Hafidz Maulana', tempat_lahir: 'Surabaya', tanggal_lahir: '2014-12-25', jenis_kelamin: 'L', id_kelas: 2, id_wali: 2 },
  { nis: '2025008', nama: 'Maryam Shafira Azzahra', tempat_lahir: 'Bangkalan', tanggal_lahir: '2015-02-14', jenis_kelamin: 'P', id_kelas: 2, id_wali: 3 },
  { nis: '2025009', nama: 'Abdullah Azzam Pratama', tempat_lahir: 'Surabaya', tanggal_lahir: '2014-06-19', jenis_kelamin: 'L', id_kelas: 3, id_wali: 4 },
  { nis: '2025010', nama: 'Salma Nadia Rahmadani', tempat_lahir: 'Surabaya', tanggal_lahir: '2014-10-02', jenis_kelamin: 'P', id_kelas: 3, id_wali: 5 },
  { nis: '2025011', nama: 'Yusuf Ibrahim Hakim', tempat_lahir: 'Lamongan', tanggal_lahir: '2013-08-27', jenis_kelamin: 'L', id_kelas: 3, id_wali: 1 },
  { nis: '2025012', nama: 'Hanifah Salsabila Putri', tempat_lahir: 'Surabaya', tanggal_lahir: '2014-04-11', jenis_kelamin: 'P', id_kelas: 3, id_wali: 2 },
];

/**
 * Skor mentah per santri per kriteria (rata-rata yang diharapkan).
 * Santri pertama memakai angka contoh Vault/ai.md §4 agar hasil sistem
 * dapat dibandingkan langsung dengan perhitungan manual (Vi = 0.7975).
 */
const skorSantri = {
  1:  { C1: 80, C2: 85, C3: 75, C4: 90, C5: 70 },
  2:  { C1: 88, C2: 92, C3: 85, C4: 78, C5: 90 },
  3:  { C1: 65, C2: 70, C3: 60, C4: 68, C5: 72 },
  4:  { C1: 92, C2: 88, C3: 95, C4: 84, C5: 80 },
  5:  { C1: 74, C2: 80, C3: 78, C4: 82, C5: 68 },
  6:  { C1: 58, C2: 62, C3: 55, C4: 60, C5: 64 },
  7:  { C1: 95, C2: 90, C3: 92, C4: 88, C5: 86 },
  8:  { C1: 70, C2: 68, C3: 72, C4: 75, C5: 66 },
  9:  { C1: 83, C2: 79, C3: 88, C4: 71, C5: 82 },
  10: { C1: 45, C2: 50, C3: 48, C4: 52, C5: 55 },
  11: { C1: 90, C2: 94, C3: 87, C4: 91, C5: 89 },
  12: { C1: 62, C2: 66, C3: 70, C4: 58, C5: 74 },
};

/** Variasi kecil antar pertemuan agar grafik tren terlihat naik-turun. */
const variasiPertemuan = [0, 3, -2, 5];

const jalankan = async () => {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database OK. Menyiapkan data contoh...\n');

    // Bersihkan data lama (urutan menghormati foreign key).
    // TRUNCATE ditolak MySQL pada tabel yang dirujuk FK, jadi dipakai DELETE
    // diikuti reset AUTO_INCREMENT agar ID data contoh dimulai dari 1.
    const bersihkan = async (model, namaTabel) => {
      await model.destroy({ where: {} });
      await sequelize.query(`ALTER TABLE \`${namaTabel}\` AUTO_INCREMENT = 1`);
    };
    await bersihkan(HasilSAW, 'hasil_saw');
    await bersihkan(Nilai, 'nilai');
    await bersihkan(Santri, 'santri');
    await bersihkan(Kelas, 'kelas');
    await bersihkan(User, 'users');
    console.log('- Data lama dibersihkan.');

    // Kriteria (bobot dari Vault/ai.md §2).
    await Kriteria.sync();
    await bersihkan(Kriteria, 'kriteria');
    for (const [i, k] of KRITERIA_DEFAULT.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await Kriteria.create({ ...k, urutan: i + 1, kelompok: k.kode === 'C5' ? 'akademik' : 'tajwid' });
    }
    const kriteria = await Kriteria.findAll();
    const kodeKeId = Object.fromEntries(kriteria.map((k) => [k.kode, k.id]));
    const totalBobot = kriteria.reduce((a, k) => a + Number(k.bobot), 0);
    console.log(`- ${kriteria.length} kriteria dibuat (total bobot = ${totalBobot.toFixed(2)}).`);

    // User dibuat berurutan: admin (ID 1), ustadz (ID 2-3), wali (ID 4-8).
    for (const u of dataUser) {
      // eslint-disable-next-line no-await-in-loop
      await User.create({ ...u, password: hash(u.password) });
    }
    const waliIds = [];
    for (const w of dataWali) {
      // eslint-disable-next-line no-await-in-loop
      const u = await User.create({ ...w, password: hash(w.password), role: 'wali_santri' });
      waliIds.push(u.id);
    }
    const users = await User.findAll();
    console.log(`- ${users.length} akun dibuat (1 admin, 2 ustadz, ${dataWali.length} wali).`);

    // Kelas + pengampu.
    const ustadzList = users.filter((u) => u.role === 'ustadz');
    for (const [i, k] of dataKelas.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await Kelas.create({ ...k, id_ustadz: ustadzList[i % ustadzList.length].id });
    }
    const kelas = await Kelas.findAll();
    console.log(`- ${kelas.length} kelas dibuat.`);

    // Santri: id_wali dipetakan ke akun wali yang sesungguhnya.
    // (Sebelumnya memakai angka 1-5 yang ternyata menunjuk akun admin/ustadz.)
    for (const [i, s] of dataSantri.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await Santri.create({ ...s, id_wali: waliIds[i % waliIds.length] });
    }
    const santri = await Santri.findAll({ order: [['id', 'ASC']] });
    console.log(`- ${santri.length} santri dibuat.`);

    // Nilai: 4 pertemuan per santri, 5 kriteria -> 240 baris.
    const ustadzByKelas = {};
    kelas.forEach((k) => { ustadzByKelas[k.id] = k.id_ustadz; });

    let jumlahNilai = 0;
    for (const s of santri) {
      const skor = skorSantri[s.id];
      if (!skor) continue;
      for (let pertemuan = 1; pertemuan <= 4; pertemuan += 1) {
        for (const k of kriteria) {
          const dasar = skor[k.kode];
          // Santri 1 dibuat identik dengan contoh manual Vault/ai.md §4
          // (semua pertemuan sama) sehingga Vi sistem harus = 0.7975.
          const selisih = s.id === 1 ? 0 : variasiPertemuan[(pertemuan - 1) % variasiPertemuan.length];
          const nilaiAkhir = Math.min(100, Math.max(0, dasar + selisih));
          // eslint-disable-next-line no-await-in-loop
          await Nilai.create({
            id_santri: s.id,
            id_kriteria: kodeKeId[k.kode],
            id_ustadz: ustadzByKelas[s.id_kelas],
            skor: nilaiAkhir,
            pertemuan_ke: pertemuan,
            periode: PERIODE,
            tanggal: new Date(2025, 7, pertemuan * 7).toISOString().slice(0, 10),
          });
          jumlahNilai += 1;
        }
      }
    }
    console.log(`- ${jumlahNilai} data nilai dibuat (periode "${PERIODE}").`);

    // Hitung SAW untuk seluruh santri (basis skala penuh) agar dashboard
    // dan rapor langsung menampilkan hasil saat pertama kali dibuka.
    const sawService = require('../src/services/saw.service');
    const hasil = await sawService.hitungDanSimpan({ periode: PERIODE, basis: 'skala_penuh' });
    console.log(`- ${hasil.hasil.length} hasil SAW dihitung & disimpan.`);

    console.log('\nContoh hasil perhitungan (basis skala penuh):');
    hasil.hasil.slice(0, 5).forEach((h) => {
      console.log(`  ${String(h.ranking || '-').padStart(2)}. ${h.nama.padEnd(26)} Vi = ${h.nilaiAkhir.toFixed(4)}  -> ${h.predikat}`);
    });

    console.log('\nAkun untuk login:');
    console.log('  admin  : admin@tpqbaiturrouf.sch.id   / admin123');
    console.log('  ustadz : ustadz1@tpqbaiturrouf.sch.id / ustadz123');
    console.log('  wali   : wali1@tpqbaiturrouf.sch.id   / wali123');
    console.log('\nSeeder selesai.');
    await sequelize.close();
  } catch (err) {
    console.error('Seeder gagal:', err.message);
    await sequelize.close();
    process.exit(1);
  }
};

jalankan();
