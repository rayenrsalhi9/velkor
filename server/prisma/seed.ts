import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { BcryptPasswordHasher } from "../src/infrastructure/security/BcryptPasswordHasher.js";
import { WILDCARD_CLAIM } from "../src/application/claims/claimsCatalog.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

interface SeedRole {
  name: string;
  description: string;
  claims: string[];
}

const AGENCY_ROLES: SeedRole[] = [
  { name: "Director of Operations", description: "Oversees daily agency operations", claims: ["documents:view-list", "documents:view-categories", "documents:upload", "documents:edit", "documents:delete", "categories:manage"] },
  { name: "Head of Sales", description: "Leads the sales team and targets", claims: ["documents:view-list", "documents:view-categories", "documents:upload", "documents:edit"] },
  { name: "Head of Marketing", description: "Owns marketing strategy and campaigns", claims: ["documents:view-list", "documents:view-categories", "documents:upload", "documents:edit"] },
  { name: "Head of Finance", description: "Manages budgets and financial reporting", claims: ["documents:view-list", "documents:view-categories", "documents:upload"] },
  { name: "Corporate Travel Manager", description: "Handles corporate client travel programs", claims: ["documents:view-list", "documents:view-categories", "documents:upload", "documents:edit", "documents:delete"] },
  { name: "Travel Consultant", description: "Books travel packages for clients", claims: ["documents:view-assigned", "documents:view-list", "documents:view-categories", "documents:upload"] },
  { name: "Senior Travel Consultant", description: "Senior advisor with editing rights", claims: ["documents:view-assigned", "documents:view-list", "documents:view-categories", "documents:upload", "documents:edit"] },
  { name: "Domestic Travel Consultant", description: "Handles domestic travel bookings", claims: ["documents:view-assigned", "documents:view-categories"] },
  { name: "Luxury Travel Specialist", description: "Arranges premium and bespoke trips", claims: ["documents:view-assigned", "documents:view-categories", "documents:upload"] },
  { name: "Cruise Specialist", description: "Specializes in cruise bookings", claims: ["documents:view-assigned", "documents:view-categories", "documents:upload"] },
  { name: "Group Travel Coordinator", description: "Coordinates group and event travel", claims: ["documents:view-assigned", "documents:view-categories", "documents:upload", "documents:edit"] },
  { name: "Destination Specialist", description: "Expert on specific travel destinations", claims: ["documents:view-list", "documents:view-categories", "documents:upload", "documents:edit"] },
  { name: "Ticketing Agent", description: "Issues and manages airline tickets", claims: ["documents:view-assigned", "documents:view-categories"] },
  { name: "Visa Specialist", description: "Handles visa applications for clients", claims: ["documents:view-assigned", "documents:view-categories", "documents:upload"] },
  { name: "Travel Insurance Advisor", description: "Sells and manages travel insurance", claims: ["documents:view-assigned", "documents:view-categories"] },
  { name: "Reservations Agent", description: "Handles reservations and availability", claims: ["documents:view-assigned", "documents:view-categories"] },
  { name: "Customer Support Agent", description: "Provides client support before and after travel", claims: ["documents:view-assigned", "documents:view-categories"] },
  { name: "Tour Operator", description: "Designs and operates tour packages", claims: ["documents:view-list", "documents:view-categories", "documents:upload", "documents:edit"] },
  { name: "Tour Guide Coordinator", description: "Manages tour guides and itineraries", claims: ["documents:view-assigned", "documents:view-categories", "documents:upload"] },
  { name: "Hotel Booking Agent", description: "Books hotel accommodations", claims: ["documents:view-assigned", "documents:view-categories", "documents:upload"] },
  { name: "Account Manager", description: "Manages key client accounts", claims: ["documents:view-list", "documents:view-categories", "documents:upload"] },
  { name: "Business Development Manager", description: "Grows agency partnerships and clients", claims: ["documents:view-list", "documents:view-categories", "documents:upload"] },
  { name: "Marketing Coordinator", description: "Executes marketing campaigns", claims: ["documents:view-list", "documents:view-categories", "documents:upload"] },
  { name: "Social Media Specialist", description: "Runs the agency social media presence", claims: ["documents:view-assigned", "documents:view-categories"] },
  { name: "Finance Officer", description: "Handles invoices and expense tracking", claims: ["documents:view-assigned", "documents:view-categories", "documents:upload"] },
  { name: "Procurement Specialist", description: "Sources suppliers and vendors", claims: ["documents:view-list", "documents:view-categories", "documents:upload"] },
  { name: "HR Manager", description: "Manages hiring and employee records", claims: ["users:manage", "roles:manage"] },
  { name: "IT Administrator", description: "Manages internal systems and user access", claims: ["users:manage", "roles:manage", "documents:view-list", "documents:view-categories"] },
  { name: "Documentation Officer", description: "Owns document intake and organization", claims: ["documents:view-list", "documents:view-categories", "documents:upload", "documents:edit", "documents:delete", "categories:manage"] },
  { name: "Compliance Officer", description: "Enforces policy and data compliance", claims: ["documents:view-list", "documents:view-categories", "documents:upload", "documents:edit", "documents:delete"] },
];

interface SeedUser {
  fullName: string;
  email: string;
  roleName: string;
}

const USERS: SeedUser[] = [
  { fullName: "Aisha Bennani", email: "aisha.bennani@velkor.local", roleName: "Director of Operations" },
  { fullName: "Karim El Fassi", email: "karim.elfassi@velkor.local", roleName: "Head of Sales" },
  { fullName: "Leila Chraibi", email: "leila.chraibi@velkor.local", roleName: "Head of Marketing" },
  { fullName: "Omar Rachidi", email: "omar.rachidi@velkor.local", roleName: "Head of Finance" },
  { fullName: "Nadia Berrada", email: "nadia.berrada@velkor.local", roleName: "Corporate Travel Manager" },
  { fullName: "Youssef Amrani", email: "youssef.amrani@velkor.local", roleName: "Travel Consultant" },
  { fullName: "Salma Tazi", email: "salma.tazi@velkor.local", roleName: "Senior Travel Consultant" },
  { fullName: "Hicham Belkadi", email: "hicham.belkadi@velkor.local", roleName: "Domestic Travel Consultant" },
  { fullName: "Imane Zoubir", email: "imane.zoubir@velkor.local", roleName: "Luxury Travel Specialist" },
  { fullName: "Mehdi El Idrissi", email: "mehdi.elidrissi@velkor.local", roleName: "Cruise Specialist" },
  { fullName: "Zineb Kabbaj", email: "zineb.kabbaj@velkor.local", roleName: "Group Travel Coordinator" },
  { fullName: "Reda Sebti", email: "reda.sebti@velkor.local", roleName: "Destination Specialist" },
  { fullName: "Fatima Zahra", email: "fatima.zahra@velkor.local", roleName: "Ticketing Agent" },
  { fullName: "Bilal Hassani", email: "bilal.hassani@velkor.local", roleName: "Visa Specialist" },
  { fullName: "Houda Naciri", email: "houda.naciri@velkor.local", roleName: "Travel Insurance Advisor" },
  { fullName: "Soufiane Dlimi", email: "soufiane.dlimi@velkor.local", roleName: "Reservations Agent" },
  { fullName: "Meryem Bouzid", email: "meryem.bouzid@velkor.local", roleName: "Customer Support Agent" },
  { fullName: "Anas Fikri", email: "anas.fikri@velkor.local", roleName: "Tour Operator" },
  { fullName: "Ghita Alaoui", email: "ghita.alaoui@velkor.local", roleName: "Tour Guide Coordinator" },
  { fullName: "Yassine Cherkaoui", email: "yassine.cherkaoui@velkor.local", roleName: "Hotel Booking Agent" },
  { fullName: "Safae Oudghiri", email: "safae.oudghiri@velkor.local", roleName: "Account Manager" },
  { fullName: "Aziz Benjelloun", email: "aziz.benjelloun@velkor.local", roleName: "Business Development Manager" },
  { fullName: "Kenza Idrissi", email: "kenza.idrissi@velkor.local", roleName: "Marketing Coordinator" },
  { fullName: "Adam Lahlou", email: "adam.lahlou@velkor.local", roleName: "Social Media Specialist" },
  { fullName: "Rim Skalli", email: "rim.skalli@velkor.local", roleName: "Finance Officer" },
  { fullName: "Walid Bennis", email: "walid.bennis@velkor.local", roleName: "Procurement Specialist" },
  { fullName: "Nora El Amrani", email: "nora.elamrani@velkor.local", roleName: "HR Manager" },
  { fullName: "Tarek Zniber", email: "tarek.zniber@velkor.local", roleName: "IT Administrator" },
  { fullName: "Lina Boujrada", email: "lina.boujrada@velkor.local", roleName: "Documentation Officer" },
  { fullName: "Marwan Chafi", email: "marwan.chafi@velkor.local", roleName: "Compliance Officer" },
  { fullName: "Dounia Rami", email: "dounia.rami@velkor.local", roleName: "Travel Consultant" },
  { fullName: "Zakaria Benali", email: "zakaria.benali@velkor.local", roleName: "Travel Consultant" },
  { fullName: "Sara Bouchtaoui", email: "sara.bouchtaoui@velkor.local", roleName: "Senior Travel Consultant" },
  { fullName: "Hamza Lazaar", email: "hamza.lazaar@velkor.local", roleName: "Reservations Agent" },
  { fullName: "Maryam Qassimi", email: "maryam.qassimi@velkor.local", roleName: "Customer Support Agent" },
  { fullName: "Ismail Sefrioui", email: "ismail.sefrioui@velkor.local", roleName: "Ticketing Agent" },
  { fullName: "Rachida Nekkour", email: "rachida.nekkour@velkor.local", roleName: "Visa Specialist" },
  { fullName: "Amine Ziani", email: "amine.ziani@velkor.local", roleName: "Tour Operator" },
  { fullName: "Selma Kadiri", email: "selma.kadiri@velkor.local", roleName: "Luxury Travel Specialist" },
  { fullName: "Fahd Meziane", email: "fahd.meziane@velkor.local", roleName: "Cruise Specialist" },
  { fullName: "Ikram Fadel", email: "ikram.fadel@velkor.local", roleName: "Group Travel Coordinator" },
  { fullName: "Rachid Ouazzani", email: "rachid.ouazzani@velkor.local", roleName: "Hotel Booking Agent" },
  { fullName: "Hajar Mellouk", email: "hajar.mellouk@velkor.local", roleName: "Account Manager" },
  { fullName: "Nabil Guedira", email: "nabil.guedira@velkor.local", roleName: "Business Development Manager" },
  { fullName: "Yasmine Tabbal", email: "yasmine.tabbal@velkor.local", roleName: "Marketing Coordinator" },
  { fullName: "Idriss Bouanani", email: "idriss.bouanani@velkor.local", roleName: "Destination Specialist" },
  { fullName: "Majda Erraji", email: "majda.erraji@velkor.local", roleName: "Finance Officer" },
  { fullName: "Othmane Latif", email: "othmane.latif@velkor.local", roleName: "Compliance Officer" },
];

const STANDARD_ROLES: SeedRole[] = [
  { name: "Employee", description: "Standard internal user access", claims: [] },
  { name: "Travel Agency", description: "External travel agency partner access", claims: [] },
];

async function upsertRole(
  prisma: PrismaClient,
  name: string,
  description: string,
): Promise<{ id: string }> {
  const existing = await prisma.role.findFirst({ where: { name } });
  return existing
    ? prisma.role.update({ where: { id: existing.id }, data: { description } })
    : prisma.role.create({ data: { name, description } });
}

async function upsertCategory(
  prisma: PrismaClient,
  input: { name: string; description: string },
): Promise<void> {
  const existing = await prisma.category.findFirst({ where: { name: input.name } });
  if (!existing) {
    await prisma.category.create({ data: input });
  }
}

async function upsertUser(
  prisma: PrismaClient,
  input: { email: string; fullName: string; passwordHash: string; roleId: string },
): Promise<void> {
  const existing = await prisma.user.findFirst({ where: { email: input.email } });
  if (!existing) {
    await prisma.user.create({ data: input });
  }
}

async function main() {
  const passwordHasher = new BcryptPasswordHasher();

  const adminRole = await upsertRole(prisma, "Admin", "Full system access and user management");

  await prisma.roleClaim.upsert({
    where: { roleId_claim: { roleId: adminRole.id, claim: WILDCARD_CLAIM } },
    update: {},
    create: { roleId: adminRole.id, claim: WILDCARD_CLAIM },
  });

  const STARTED_CATEGORIES = [
    { name: "Policies", description: "Internal agency policies and procedures" },
    { name: "Reports", description: "Monthly and quarterly business reports" },
    { name: "Contracts", description: "Client and supplier contracts" },
  ];
  for (const category of STARTED_CATEGORIES) {
    await upsertCategory(prisma, category);
  }

  const roleByName = new Map<string, string>();
  roleByName.set("Admin", adminRole.id);
  for (const role of [...STANDARD_ROLES, ...AGENCY_ROLES]) {
    const record = await upsertRole(prisma, role.name, role.description);
    roleByName.set(role.name, record.id);
    for (const claim of role.claims) {
      await prisma.roleClaim.upsert({
        where: { roleId_claim: { roleId: record.id, claim } },
        update: {},
        create: { roleId: record.id, claim },
      });
    }
  }

  await upsertUser(prisma, {
    email: "admin@velkor.local",
    fullName: "Admin User",
    passwordHash: await passwordHasher.hash("Admin123!"),
    roleId: adminRole.id,
  });

  for (const user of USERS) {
    await upsertUser(prisma, {
      email: user.email,
      fullName: user.fullName,
      passwordHash: await passwordHasher.hash("Agency123!"),
      roleId: roleByName.get(user.roleName)!,
    });
  }

  await upsertUser(prisma, {
    email: "sara.mansour@velkor.local",
    fullName: "Sara Mansour",
    passwordHash: await passwordHasher.hash("Agency123!"),
    roleId: roleByName.get("Travel Agency")!,
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
