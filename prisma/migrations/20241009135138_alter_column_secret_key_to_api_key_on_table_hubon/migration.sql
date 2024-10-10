/*
  Warnings:

  - You are about to drop the column `secretKey` on the `hubon` table. All the data in the column will be lost.
  - Added the required column `apiKey` to the `hubon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `hubon` DROP COLUMN `secretKey`,
    ADD COLUMN `apiKey` LONGTEXT NOT NULL;
