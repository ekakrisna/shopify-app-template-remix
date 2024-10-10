-- CreateTable
CREATE TABLE `hubon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(191) NOT NULL,
    `secretKey` LONGTEXT NOT NULL,
    `defaultProductId` VARCHAR(191) NULL,

    UNIQUE INDEX `hubon_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
