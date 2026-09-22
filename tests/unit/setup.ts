import { execSync } from "node:child_process";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./test.db";

execSync("npx prisma db push --skip-generate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: "file:./test.db" },
});
