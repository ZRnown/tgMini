-- CreateTable
CREATE TABLE `User` (
    `id` BIGINT NOT NULL,
    `username` VARCHAR(191) NULL,
    `inviterId` BIGINT NULL,
    `balance` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `balanceFrozen` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `points` INTEGER NOT NULL DEFAULT 0,
    `vipLevel` INTEGER NOT NULL DEFAULT 1,
    `checkInStreak` INTEGER NOT NULL DEFAULT 0,
    `lastCheckInDate` DATETIME(3) NULL,
    `isBanned` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `User_inviterId_idx`(`inviterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Exchange` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `regLink` VARCHAR(191) NULL,
    `guide` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Exchange_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserBinding` (
    `id` VARCHAR(191) NOT NULL,
    `userId` BIGINT NOT NULL,
    `exchangeId` VARCHAR(191) NOT NULL,
    `uid` VARCHAR(191) NOT NULL,
    `status` ENUM('UNBOUND', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `submitTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` BIGINT NULL,
    `rejectReason` VARCHAR(191) NULL,

    INDEX `UserBinding_status_idx`(`status`),
    UNIQUE INDEX `UserBinding_exchangeId_uid_key`(`exchangeId`, `uid`),
    UNIQUE INDEX `UserBinding_userId_exchangeId_key`(`userId`, `exchangeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransactionLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` BIGINT NOT NULL,
    `type` ENUM('REBATE', 'WITHDRAWAL', 'POINT_CONVERT', 'CHECKIN', 'ADJUSTMENT') NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `balanceDelta` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `pointsDelta` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'COMPLETED',
    `referenceId` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TransactionLog_userId_type_createdAt_idx`(`userId`, `type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VipConfig` (
    `level` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `minPoints` INTEGER NOT NULL,
    `rebateRatioBonus` DECIMAL(65, 30) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`level`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WithdrawalRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` BIGINT NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `fee` DECIMAL(65, 30) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `txHash` VARCHAR(191) NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `reviewedBy` BIGINT NULL,
    `memo` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(191) NULL,

    UNIQUE INDEX `WithdrawalRequest_idempotencyKey_key`(`idempotencyKey`),
    INDEX `WithdrawalRequest_status_requestedAt_idx`(`status`, `requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyTradeReport` (
    `id` VARCHAR(191) NOT NULL,
    `exchangeId` VARCHAR(191) NOT NULL,
    `userId` BIGINT NOT NULL,
    `tradeDate` DATETIME(3) NOT NULL,
    `tradeVolume` DECIMAL(65, 30) NOT NULL,
    `baseFeeRate` DECIMAL(65, 30) NOT NULL,
    `autoRebate` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `manualRebate` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `source` VARCHAR(191) NULL,
    `raw` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DailyTradeReport_tradeDate_idx`(`tradeDate`),
    UNIQUE INDEX `DailyTradeReport_exchangeId_userId_tradeDate_key`(`exchangeId`, `userId`, `tradeDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RebateSettlement` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `userId` BIGINT NOT NULL,
    `tradeDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('PENDING', 'SCHEDULED', 'SETTLED', 'VOID') NOT NULL DEFAULT 'SCHEDULED',
    `scheduledAt` DATETIME(3) NOT NULL,
    `settledAt` DATETIME(3) NULL,

    UNIQUE INDEX `RebateSettlement_reportId_key`(`reportId`),
    INDEX `RebateSettlement_status_scheduledAt_idx`(`status`, `scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Config` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReplayNonce` (
    `nonce` VARCHAR(191) NOT NULL,
    `userId` BIGINT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReplayNonce_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`nonce`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserBinding` ADD CONSTRAINT `UserBinding_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBinding` ADD CONSTRAINT `UserBinding_exchangeId_fkey` FOREIGN KEY (`exchangeId`) REFERENCES `Exchange`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionLog` ADD CONSTRAINT `TransactionLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WithdrawalRequest` ADD CONSTRAINT `WithdrawalRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyTradeReport` ADD CONSTRAINT `DailyTradeReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyTradeReport` ADD CONSTRAINT `DailyTradeReport_exchangeId_fkey` FOREIGN KEY (`exchangeId`) REFERENCES `Exchange`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RebateSettlement` ADD CONSTRAINT `RebateSettlement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RebateSettlement` ADD CONSTRAINT `RebateSettlement_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `DailyTradeReport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

