/*
  Warnings:

  - Added the required column `sessionId` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `book` MODIFY `genre` VARCHAR(191) NULL,
    MODIFY `publisher` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `purchase` ADD COLUMN `sessionId` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending';
