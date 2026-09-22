import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const postgres = Boolean(process.env.DATABASE_URL?.startsWith("postgres"));
if (process.env.VERCEL && !postgres) {
  console.error("Vercel needs DATABASE_URL set to a postgresql:// connection string.");
  process.exit(1);
}
const schema = postgres ? "prisma/schema.production.prisma" : "prisma/schema.prisma";

run("npx", ["prisma", "generate", `--schema=${schema}`]);

if (postgres) {
  run("npx", ["prisma", "db", "push", `--schema=${schema}`, "--skip-generate"]);
  const seed = spawnSync("npx", ["tsx", "scripts/seed-if-empty.ts"], { stdio: "inherit", shell: true });
  if (seed.status !== 0) {
    console.warn("Seed skipped or failed; the app can still start.");
  }
}

run("npx", ["next", "build"]);
