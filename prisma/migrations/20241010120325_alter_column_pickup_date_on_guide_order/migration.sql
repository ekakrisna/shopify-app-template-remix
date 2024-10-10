/*
  Warnings:

  - You are about to drop the column `isPickupDateBasic` on the `guide` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `guide` DROP COLUMN `isPickupDateBasic`,
    ADD COLUMN `isPickupWidget` BOOLEAN NOT NULL DEFAULT false;
