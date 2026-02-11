import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const migrationClient = postgres(connectionString, { max: 1 });

async function main() {
  console.log("Running migrations...");

  await migrate(drizzle(migrationClient), {
    migrationsFolder: "./drizzle",
  });

  console.log("Migrations completed!");
  await migrationClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed!", err);
  process.exit(1);
});
