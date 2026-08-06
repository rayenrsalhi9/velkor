-- CreateTable
CREATE TABLE "RoleClaim" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "claim" TEXT NOT NULL,

    CONSTRAINT "RoleClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleClaim_claim_idx" ON "RoleClaim"("claim");

-- CreateIndex
CREATE UNIQUE INDEX "RoleClaim_roleId_claim_key" ON "RoleClaim"("roleId", "claim");

-- AddForeignKey
ALTER TABLE "RoleClaim" ADD CONSTRAINT "RoleClaim_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
