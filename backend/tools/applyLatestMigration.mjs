#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env file: DOTENV_CONFIG_PATH overrides default .env (used by migrate:prod)
const envFile = process.env.DOTENV_CONFIG_PATH
  ? path.resolve(__dirname, '..', process.env.DOTENV_CONFIG_PATH)
  : path.resolve(__dirname, '../.env');
dotenvConfig({ path: envFile });

import fs from 'fs/promises';
import pg from 'pg';

const { Client } = pg;

function log(...args) {
  console.log('[migrate]', ...args);
}

async function run() {
  const migrationsDir = path.resolve(__dirname, '../migrations');

  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql'));
  if (!files.length) {
    log('No migrations found in', migrationsDir);
    process.exit(0);
  }

  files.sort();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(2);
  }

  const allowInsecure =
    (process.env.ALLOW_INSECURE_DB || '').toLowerCase() === 'true' ||
    (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || '').toLowerCase() === 'false';

  // Strip sslmode from connection string so pg client SSL config takes precedence
  const cleanedConnectionString = allowInsecure
    ? connectionString.replace(/[?&]sslmode=[^&]*/g, (m) => m.startsWith('?') ? '?' : '')
    : connectionString;

  const client = new Client({
    connectionString: cleanedConnectionString,
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

    const { rows: applied } = await client.query('SELECT filename FROM backend_migrations');
    const appliedSet = new Set(applied.map((r) => r.filename));

    const pending = files.filter((f) => !appliedSet.has(f));

    if (!pending.length) {
      log('All migrations already applied. Nothing to do.');
      process.exit(0);
    }

    log(`${pending.length} pending migration(s): ${pending.join(', ')}`);

    for (const filename of pending) {
      const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8');
      await client.query('BEGIN');
      try {
        log(`Applying ${filename} ...`);
        await client.query(sql);
        await client.query('INSERT INTO backend_migrations(filename) VALUES($1)', [filename]);
        await client.query('COMMIT');
        log(`✓ Applied ${filename}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(3);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
