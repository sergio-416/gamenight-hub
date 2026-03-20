import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

let container: StartedPostgreSqlContainer;

export async function setup() {
  container = await new PostgreSqlContainer("postgres:17")
    .withDatabase("gamenight_test")
    .withUsername("gamenight")
    .withPassword("gamenight_test")
    .start();

  const url = container.getConnectionUri();
  process.env.POSTGRES_URL = url;

  const client = postgres(url, { max: 1 });
  const db = drizzle({ client });
  await migrate(db, { migrationsFolder: "./src/database/migrations" });
  await client.end();
}

export async function teardown() {
  await container?.stop();
}
