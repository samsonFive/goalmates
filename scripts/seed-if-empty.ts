import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";

const db = new PrismaClient();

async function main() {
  const users = await db.user.count();
  if (users > 0) {
    console.log("Database already has users; skipping seed.");
    return;
  }
  const result = spawnSync("npx", ["tsx", "prisma/seed.ts"], { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
