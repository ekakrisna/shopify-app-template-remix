-- CreateTable
CREATE TABLE `guide` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(191) NOT NULL,
    `isCarrier` BOOLEAN NOT NULL DEFAULT false,
    `isPickupDateBasic` BOOLEAN NOT NULL DEFAULT false,
    `isButtonBuy` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `guide_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
