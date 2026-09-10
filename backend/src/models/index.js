const { sequelize } = require('../config/database');

const User = require('./User.model');
const Kelas = require('./Kelas.model');
const Santri = require('./Santri.model');
const Kriteria = require('./Kriteria.model');
const Nilai = require('./Nilai.model');
const HasilSAW = require('./HasilSAW.model');

/* ------------------------------------------------------------------ *
 * Relasi antar tabel — Vault/design.md §6
 * users (1) ── (N) santri   [sebagai wali]
 * kelas (1) ── (N) santri
 * users (1) ── (N) kelas    [sebagai ustadz]
 * santri (1) ── (N) nilai
 * kriteria (1) ── (N) nilai
 * santri (1) ── (N) hasil_saw
 * ------------------------------------------------------------------ */

User.hasMany(Santri, { as: 'santriAsWali', foreignKey: 'id_wali' });
Santri.belongsTo(User, { as: 'wali', foreignKey: 'id_wali' });

Kelas.hasMany(Santri, { as: 'daftarSantri', foreignKey: 'id_kelas' });
Santri.belongsTo(Kelas, { as: 'kelas', foreignKey: 'id_kelas' });

User.hasMany(Kelas, { as: 'kelasDiampu', foreignKey: 'id_ustadz' });
Kelas.belongsTo(User, { as: 'ustadz', foreignKey: 'id_ustadz' });

Santri.hasMany(Nilai, { as: 'daftarNilai', foreignKey: 'id_santri' });
Nilai.belongsTo(Santri, { as: 'santri', foreignKey: 'id_santri' });

Kriteria.hasMany(Nilai, { as: 'daftarNilai', foreignKey: 'id_kriteria' });
Nilai.belongsTo(Kriteria, { as: 'kriteria', foreignKey: 'id_kriteria' });

User.hasMany(Nilai, { as: 'nilaiDiinput', foreignKey: 'id_ustadz' });
Nilai.belongsTo(User, { as: 'ustadzPenginput', foreignKey: 'id_ustadz' });

Santri.hasMany(HasilSAW, { as: 'hasilSaw', foreignKey: 'id_santri' });
HasilSAW.belongsTo(Santri, { as: 'santri', foreignKey: 'id_santri' });

module.exports = {
  sequelize,
  User,
  Kelas,
  Santri,
  Kriteria,
  Nilai,
  HasilSAW,
};
