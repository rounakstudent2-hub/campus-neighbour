import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = Boolean(
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))
);

let sqliteDb = null;
let pgPool = null;

if (isPostgres) {
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  console.log('✅ Connected to PostgreSQL database');
} else {
  const dbDir = path.resolve(__dirname, '../../database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'marketplace.sqlite');
  sqliteDb = new DatabaseSync(dbPath);
  console.log(`✅ Connected to SQLite database at ${dbPath}`);
}

/**
 * Standardize parameter markers:
 * If query has $1, $2 and we are on SQLite, convert to ?
 * If query has ? and we are on Postgres, convert to $1, $2
 */
function normalizeQuery(sql, targetEngine) {
  if (targetEngine === 'sqlite') {
    // Replace $1, $2, etc with ?
    return sql.replace(/\$\d+/g, '?');
  } else {
    // Replace ? with $1, $2, etc
    let counter = 1;
    return sql.replace(/\?/g, () => `$${counter++}`);
  }
}

export const db = {
  isPostgres,

  async query(sql, params = []) {
    const safeParams = params.map(p => (p === undefined ? null : p));
    if (isPostgres) {
      const normalizedSql = normalizeQuery(sql, 'postgres');
      const res = await pgPool.query(normalizedSql, safeParams);
      return { rows: res.rows, rowCount: res.rowCount };
    } else {
      const normalizedSql = normalizeQuery(sql, 'sqlite');
      const stmt = sqliteDb.prepare(normalizedSql);
      const rows = stmt.all(...safeParams);
      return { rows, rowCount: rows.length };
    }
  },

  async get(sql, params = []) {
    const safeParams = params.map(p => (p === undefined ? null : p));
    if (isPostgres) {
      const res = await this.query(sql, safeParams);
      return res.rows[0] || null;
    } else {
      const normalizedSql = normalizeQuery(sql, 'sqlite');
      const stmt = sqliteDb.prepare(normalizedSql);
      const row = stmt.get(...safeParams);
      return row || null;
    }
  },

  async run(sql, params = []) {
    const safeParams = params.map(p => (p === undefined ? null : p));
    if (isPostgres) {
      const normalizedSql = normalizeQuery(sql, 'postgres');
      const res = await pgPool.query(normalizedSql, safeParams);
      return { changes: res.rowCount };
    } else {
      const normalizedSql = normalizeQuery(sql, 'sqlite');
      const stmt = sqliteDb.prepare(normalizedSql);
      const info = stmt.run(...safeParams);
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  },

  async exec(sql) {
    if (isPostgres) {
      await pgPool.query(sql);
    } else {
      sqliteDb.exec(sql);
    }
  },

  async initSchema() {
    const schemaFile = isPostgres ? 'postgres-schema.sql' : 'schema.sql';
    const schemaPath = path.join(__dirname, schemaFile);
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      if (isPostgres) {
        await pgPool.query(sql);
      } else {
        sqliteDb.exec(sql);
      }
      console.log(`✅ Database schema initialized from ${schemaFile}`);
    }
  }
};

export default db;
