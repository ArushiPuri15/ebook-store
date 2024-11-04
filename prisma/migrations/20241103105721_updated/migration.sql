/*
  Warnings:

  - Added the required column `quantity` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `purchase` ADD COLUMN `quantity` INTEGER NOT NULL;
