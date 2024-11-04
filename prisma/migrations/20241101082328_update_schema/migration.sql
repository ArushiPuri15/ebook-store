-- DropForeignKey
ALTER TABLE `rating` DROP FOREIGN KEY `rating_bookId_fkey`;

-- DropForeignKey
ALTER TABLE `rating` DROP FOREIGN KEY `rating_userId_fkey`;

-- CreateTable
CREATE TABLE `_UserBooks` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_UserBooks_AB_unique`(`A`, `B`),
    INDEX `_UserBooks_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Rating` ADD CONSTRAINT `Rating_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rating` ADD CONSTRAINT `Rating_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserBooks` ADD CONSTRAINT `_UserBooks_A_fkey` FOREIGN KEY (`A`) REFERENCES `Book`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserBooks` ADD CONSTRAINT `_UserBooks_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
