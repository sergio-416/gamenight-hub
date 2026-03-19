#!/bin/sh
set -e

echo "Running database migrations..."
node --input-type=module << 'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const client = postgres(process.env.POSTGRES_URL, { max: 1 });
const db = drizzle({ client });

try {
  await migrate(db, { migrationsFolder: './src/database/migrations' });
  console.log('Migrations complete');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  await client.end();
}
EOF

echo "Starting application..."
exec node dist/main.js
