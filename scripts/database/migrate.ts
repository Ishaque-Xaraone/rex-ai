import { MigrationRunner } from '../Backend/src/database/migration-runner.js';
import { closePool } from '../Backend/src/database/connection.js';

const direction = process.argv[2] === 'down' ? 'down' : 'up';
const runner = new MigrationRunner();

async function run() {
  try {
    if (direction === 'down') {
      await runner.down();
    } else {
      await runner.up();
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

run();
