import pg from "pg";
import { getDatabaseUrl } from "./db-migrations.mjs";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Client } = pg;
const RETRIES = 30;
const DELAY_MS = 1000;

loadLocalEnv();

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const connectionString = getDatabaseUrl();

  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const client = new Client({ connectionString });

    try {
      await client.connect();
      await client.query("select 1");
      await client.end();
      console.log("Database is ready.");
      return;
    } catch (error) {
      await client.end().catch(() => undefined);

      if (attempt === RETRIES) {
        throw error;
      }

      console.log(`Waiting for database (${attempt}/${RETRIES})...`);
      await sleep(DELAY_MS);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
