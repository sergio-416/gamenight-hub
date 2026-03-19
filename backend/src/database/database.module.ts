import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export const DB_TOKEN = Symbol("DRIZZLE_DB");

export type DrizzleDb = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>("POSTGRES_URL");
        const client = postgres(url, { max: 10 });
        return drizzle({ client, schema });
      },
    },
  ],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}
