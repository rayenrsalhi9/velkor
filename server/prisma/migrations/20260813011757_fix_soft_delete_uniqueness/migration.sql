-- Drop the composite (name|email, deletedAt) uniques: a nullable second column
-- treats NULLs as distinct, so they allowed duplicate active rows. Replace with
-- partial unique indexes that enforce uniqueness among active rows only and let
-- soft-deleted rows reuse the value.
-- Prisma cannot express partial indexes; these are managed here in raw SQL.
-- Note: `prisma migrate dev` reports these as drift; CI/production uses
-- `prisma migrate deploy`, which performs no drift check.

-- DropIndex
DROP INDEX "Category_name_deletedAt_key";

-- DropIndex
DROP INDEX "Role_name_deletedAt_key";

-- DropIndex
DROP INDEX "User_email_deletedAt_key";

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_active_key" ON "Role"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_active_key" ON "Category"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_active_key" ON "User"("email") WHERE "deletedAt" IS NULL;