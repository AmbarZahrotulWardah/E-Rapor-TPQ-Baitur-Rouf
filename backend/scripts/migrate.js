/**
 * Menjalankan seluruh file SQL di folder migrations/ secara berurutan.
 *   node scripts/migrate.js          -> terapkan migrasi
 *   node scripts/migrate.js --drop   -> hapus database lalu terapkan ulang
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.DB_NAME || 'e_rapor_tpq';

const koneksiDasar = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const jalankan = async () => {
  const conn = await mysql.createConnection(koneksiDasar);

  if (process.argv.includes('--drop')) {
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    console.log(`Database \`${DB_NAME}\` dihapus.`);
  }

  const folder = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(folder).filter((f) => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.log('Tidak ada file .sql di folder migrations/.');
    await conn.end();
    return;
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(folder, file), 'utf8');
    process.stdout.write(`Menjalankan ${file} ... `);
    await conn.query(sql);
    console.log('OK');
  }

  const [tabel] = await conn.query(
    `SELECT TABLE_NAME AS nama FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
    [DB_NAME]
  );
  console.log(`\nSelesai. Tabel pada database \`${DB_NAME}\`: ${tabel.map((t) => t.nama).join(', ')}`);

  await conn.end();
};

jalankan().catch((err) => {
  console.error('Migrasi gagal:', err.message);
  process.exit(1);
});
