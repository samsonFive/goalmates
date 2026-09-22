import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const user = await db.user.findUnique({ where: { email: "jordan@goalmates.local" } });
  console.log({
    found: Boolean(user),
    name: user?.name,
    ok: user ? await compare("household-demo", user.passwordHash) : false,
  });
}

main().finally(() => db.$disconnect());
