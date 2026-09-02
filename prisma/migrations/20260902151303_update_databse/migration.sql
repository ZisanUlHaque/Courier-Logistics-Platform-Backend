-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIAL', 'GOOGLE');

-- DropIndex
DROP INDEX "shipment_tracking_events_createdAt_idx";

-- DropIndex
DROP INDEX "users_email_idx";

-- AlterTable
ALTER TABLE "courier_profiles" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalDeliveries" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIAL';

-- CreateIndex
CREATE INDEX "hubs_status_idx" ON "hubs"("status");

-- CreateIndex
CREATE INDEX "shipment_tracking_events_shipmentId_createdAt_idx" ON "shipment_tracking_events"("shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "shipments_customerId_status_idx" ON "shipments"("customerId", "status");
