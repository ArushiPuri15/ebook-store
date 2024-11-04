/*
  Warnings:

  - You are about to drop the column `sessionId` on the `sale` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `sale` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `book` ADD COLUMN `pdf` VARCHAR(191) NULL,
    ADD COLUMN `thumbnail` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `purchase` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'completed';

-- AlterTable
ALTER TABLE `sale` DROP COLUMN `sessionId`,
    DROP COLUMN `status`,
    ADD COLUMN `amount` DOUBLE NOT NULL;
