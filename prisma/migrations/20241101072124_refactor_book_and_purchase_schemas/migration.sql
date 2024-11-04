/*
  Warnings:

  - You are about to drop the column `rating` on the `book` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `rating` DROP FOREIGN KEY `Rating_bookId_fkey`;

-- DropForeignKey
ALTER TABLE `rating` DROP FOREIGN KEY `Rating_userId_fkey`;

-- AlterTable
ALTER TABLE `book` DROP COLUMN `rating`,
    ADD COLUMN `averageRating` DOUBLE NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `rating` ADD CONSTRAINT `rating_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `book`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rating` ADD CONSTRAINT `rating_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `_bookauthors` RENAME INDEX `_BookAuthors_AB_unique` TO `_bookauthors_AB_unique`;

-- RenameIndex
ALTER TABLE `_bookauthors` RENAME INDEX `_BookAuthors_B_index` TO `_bookauthors_B_index`;

-- RenameIndex
ALTER TABLE `_booktags` RENAME INDEX `_BookTags_AB_unique` TO `_booktags_AB_unique`;

-- RenameIndex
ALTER TABLE `_booktags` RENAME INDEX `_BookTags_B_index` TO `_booktags_B_index`;
