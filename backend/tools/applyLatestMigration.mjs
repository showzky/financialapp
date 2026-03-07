#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;

function log(...args) {
  console.log('[migrate]', ...args);
}

async function run() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsDir = path.resolve(__dirname, '../migrations');

  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql'));
  if (!files.length) {
    log('No migrations found in', migrationsDir);
    process.exit(0);
  }

  files.sort();
  const latest = files[files.length - 1];
  const filePath = path.join(migrationsDir, latest);
  log('Latest migration:', latest);

  const sql = await fs.readFile(filePath, 'utf8');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(2);
  }

  const allowInsecure = (process.env.ALLOW_INSECURE_DB || '').toLowerCase() === 'true';

  const client = new Client({
    connectionString,
    ssl: allowInsecure ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();

    // track applied migrations in a simple table
    await client.query(`
      CREATE TABLE IF NOT EXISTS backend_migrations (
        id serial primary key,
        filename text UNIQUE,
        applied_at timestamptz default now()
      );
    `);

    const res = await client.query('select filename from backend_migrations where filename = $1', [latest]);
    if (res.rows.length) {
      log(`${latest} already applied, skipping.`);
      process.exit(0);
    }

    await client.query('BEGIN');
    log('Applying', latest);
    await client.query(sql);
    await client.query('insert into backend_migrations(filename) values($1)', [latest]);
    await client.query('COMMIT');
    log('Applied', latest);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration failed:', err.message || err);
    process.exit(3);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
