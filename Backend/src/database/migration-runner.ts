import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, closePool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MigrationRunner {
  private migrationsDir: string;

  constructor(migrationsDir?: string) {
    this.migrationsDir = migrationsDir ?? path.resolve(__dirname, '../../migrations');
  }

  private async ensureMigrationTable(client: any): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async up(): Promise<{ applied: string[]; message: string }> {
    const pool = getPool();
    const client = await pool.connect();
    const applied: string[] = [];

    try {
      await client.query('BEGIN');
      await this.ensureMigrationTable(client);

      const { rows: existingRows } = await client.query(
        'SELECT name FROM schema_migrations ORDER BY id ASC'
      );
      const appliedSet = new Set(existingRows.map((r: { name: string }) => r.name));

      const files = await fs.readdir(this.migrationsDir);
      const upFiles = files
        .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
        .sort();

      for (const file of upFiles) {
        if (!appliedSet.has(file)) {
          const filePath = path.join(this.migrationsDir, file);
          const sql = await fs.readFile(filePath, 'utf-8');

          console.log(`[Migration] Applying ${file}...`);
          await client.query(sql);
          await client.query(
            'INSERT INTO schema_migrations (name) VALUES ($1)',
            [file]
          );
          applied.push(file);
        }
      }

      await client.query('COMMIT');
      const message = applied.length > 0
        ? `Successfully applied ${applied.length} migration(s): ${applied.join(', ')}`
        : 'Database is already up to date.';
      console.log(`[Migration] ${message}`);
      return { applied, message };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Migration] Failed to apply migrations, transaction rolled back:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  public async down(): Promise<{ reverted: string | null; message: string }> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await this.ensureMigrationTable(client);

      const { rows } = await client.query(
        'SELECT name FROM schema_migrations ORDER BY id DESC LIMIT 1'
      );

      if (rows.length === 0) {
        await client.query('COMMIT');
        return { reverted: null, message: 'No migrations to revert.' };
      }

      const latestMigration = rows[0].name as string;
      const downFileName = latestMigration.replace(/\.sql$/, '.down.sql');
      const downFilePath = path.join(this.migrationsDir, downFileName);

      const sql = await fs.readFile(downFilePath, 'utf-8');
      console.log(`[Migration] Reverting ${latestMigration} using ${downFileName}...`);
      await client.query(sql);
      await client.query('DELETE FROM schema_migrations WHERE name = $1', [latestMigration]);

      await client.query('COMMIT');
      const message = `Successfully reverted ${latestMigration}`;
      console.log(`[Migration] ${message}`);
      return { reverted: latestMigration, message };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Migration] Rollback failed, transaction rolled back:', err);
      throw err;
    } finally {
      client.release();
    }
  }
}

// CLI execution handling
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';
  const runner = new MigrationRunner();

  (async () => {
    try {
      if (direction === 'down') {
        await runner.down();
      } else {
        await runner.up();
      }
    } catch (err) {
      console.error('[Migration CLI] Error running migration:', err);
      process.exit(1);
    } finally {
      await closePool();
    }
  })();
}
