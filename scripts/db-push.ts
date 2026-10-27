import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run Drizzle. Set it in your .env file.");
}

const migrationUrl = new URL(databaseUrl);
if (migrationUrl.hostname.endsWith(".pooler.supabase.com") && migrationUrl.port === "6543") {
  migrationUrl.port = "5432";
  console.info("Using Supabase session pooler port 5432 for schema migration.");
}
const migrationDatabaseUrl = migrationUrl.toString();
const supabaseUrl = process.env["SUPABASE_URL"];
if (supabaseUrl) {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const databaseUser = decodeURIComponent(migrationUrl.username);
  if (
    databaseUser.startsWith("postgres.") &&
    databaseUser.slice("postgres.".length) !== projectRef
  ) {
    throw new Error(
      "The Supabase project in DATABASE_URL does not match SUPABASE_URL. Copy both values from the same Supabase project.",
    );
  }
}

async function runSqlFile(client: ReturnType<typeof postgres>, file: string) {
  const source = await readFile(join(root, file), "utf8");
  const statements = source
    .split("-- drizzle-statement")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await client.unsafe(statement);
  }
}

const client = postgres(migrationDatabaseUrl, { max: 1, connect_timeout: 20 });
try {
  await runSqlFile(client, "drizzle/pre-push.sql");

  const push = spawnSync(process.execPath, ["x", "drizzle-kit", "push"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: migrationDatabaseUrl,
    },
  });
  if (push.error) {
    throw push.error;
  }
  if (push.status !== 0) {
    process.exitCode = push.status ?? 1;
  } else {
    await runSqlFile(client, "drizzle/post-push.sql");
  }
} catch (error) {
  if (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "XX000" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("tenant/user")
  ) {
    throw new Error(
      "Supabase rejected the database tenant/user. Confirm DATABASE_URL was copied from the same project's Connect dialog, including its current pooler region and username. The Supabase project reference now matches the app URL.",
    );
  }
  throw error;
} finally {
  await client.end();
}
