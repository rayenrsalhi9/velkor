import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { BcryptPasswordHasher } from "../src/infrastructure/security/BcryptPasswordHasher.js";
import { WILDCARD_CLAIM } from "../src/application/claims/claimsCatalog.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const passwordHasher = new BcryptPasswordHasher();

  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: { description: "Full system access and user management" },
    create: {
      name: "Admin",
      description: "Full system access and user management",
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: "Employee" },
    update: { description: "Standard internal user access" },
    create: { name: "Employee", description: "Standard internal user access" },
  });

  const travelAgencyRole = await prisma.role.upsert({
    where: { name: "Travel Agency" },
    update: { description: "External travel agency partner access" },
    create: {
      name: "Travel Agency",
      description: "External travel agency partner access",
    },
  });

  await prisma.roleClaim.upsert({
    where: { roleId_claim: { roleId: adminRole.id, claim: WILDCARD_CLAIM } },
    update: {},
    create: { roleId: adminRole.id, claim: WILDCARD_CLAIM },
  });

  await prisma.user.upsert({
    where: { email: "admin@velkor.local" },
    update: {},
    create: {
      email: "admin@velkor.local",
      fullName: "Admin User",
      passwordHash: await passwordHasher.hash("Admin123!"),
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "sara.mansour@velkor.local" },
    update: {},
    create: {
      email: "sara.mansour@velkor.local",
      fullName: "Sara Mansour",
      passwordHash: await passwordHasher.hash("Agency123!"),
      roleId: travelAgencyRole.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
