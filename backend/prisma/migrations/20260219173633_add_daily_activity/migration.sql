/*
  Warnings:

  - You are about to drop the column `lastActiveDate` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `streak` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `lastActiveDate`,
    DROP COLUMN `streak`;

-- CreateTable
CREATE TABLE `DailyActivity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `DailyActivity_date_userId_key`(`date`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DailyActivity` ADD CONSTRAINT `DailyActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
