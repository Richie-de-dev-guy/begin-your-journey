import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import postgres from "postgres";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Set it in your .env file.");
}

const connectionUrl = new URL(databaseUrl);
if (connectionUrl.hostname.endsWith(".pooler.supabase.com") && connectionUrl.port === "6543") {
  connectionUrl.port = "5432";
}

const projectUrl = process.env["SUPABASE_URL"];
if (projectUrl) {
  const projectRef = new URL(projectUrl).hostname.split(".")[0];
  const databaseUser = decodeURIComponent(connectionUrl.username);
  if (
    databaseUser.startsWith("postgres.") &&
    databaseUser.slice("postgres.".length) !== projectRef
  ) {
    throw new Error("DATABASE_URL and SUPABASE_URL refer to different Supabase projects.");
  }
}

const configuredEmail = process.env["ADMIN_EMAIL"]?.trim();
let emailInput = process.argv[2] ?? configuredEmail;
if (!emailInput) {
  const prompt = createInterface({ input: stdin, output: stdout });
  emailInput = await prompt.question("Admin account email: ");
  prompt.close();
}
const email = emailInput.trim().toLowerCase();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Enter a valid email address for an existing Supabase Auth user.");
}

const db = postgres(connectionUrl.toString(), { max: 1, connect_timeout: 20 });
try {
  const tableCheck = await db<{ exists: boolean }[]>`
    select to_regclass('public.profiles') is not null
      and to_regclass('public.user_roles') is not null
      and to_regclass('public.role_permissions') is not null as exists
  `;
  const exists = tableCheck[0]?.exists ?? false;
  if (!exists) {
    throw new Error("Admin tables are not installed yet. Run bun run db:push first.");
  }

  const users = await db<{ id: string; email: string | null }[]>`
    select id, email
    from auth.users
    where lower(email) = ${email}
    limit 2
  `;
  if (users.length === 0) {
    throw new Error(
      "No Supabase Auth account matches that email. Create or invite the user in Supabase Authentication, then run this command again.",
    );
  }
  if (users.length > 1) {
    throw new Error("More than one Auth account matches that email; no role was changed.");
  }

  const user = users[0]!;
  await db.begin(async (transaction) => {
    await transaction`
      insert into public.profiles (id, email, full_name, is_active)
      select id, email, coalesce(raw_user_meta_data->>'full_name', ''), true
      from auth.users
      where id = ${user.id}
      on conflict (id) do update
      set email = excluded.email, is_active = true
    `;
    await transaction`
      insert into public.user_roles (user_id, role)
      values (${user.id}, 'super_admin'::public.app_role)
      on conflict (user_id, role) do nothing
    `;
    await transaction`
      insert into public.role_permissions (role, permission)
      values ('super_admin'::public.app_role, 'dashboard.view')
      on conflict (role, permission) do nothing
    `;
  });

  console.log(`Granted super_admin access to ${user.email ?? email}.`);
  console.log("Activated the staff profile and ensured dashboard.view access.");
  console.log("Sign in at /admin/login using this account's existing Supabase password.");
} finally {
  await db.end();
}
