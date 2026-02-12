-- CreateEnum
CREATE TYPE "BindingStatus" AS ENUM ('UNBOUND', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('REBATE', 'WITHDRAWAL', 'POINT_CONVERT', 'CHECKIN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'SCHEDULED', 'SETTLED', 'VOID');

-- CreateTable
CREATE TABLE "User" (
    "id" BIGINT NOT NULL,
    "username" TEXT,
    "inviterId" BIGINT,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balanceFrozen" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "vipLevel" INTEGER NOT NULL DEFAULT 1,
    "checkInStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCheckInDate" TIMESTAMP(3),
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exchange" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "regLink" TEXT,
    "guide" TEXT,
    "status" "ExchangeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBinding" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "status" "BindingStatus" NOT NULL DEFAULT 'PENDING',
    "submitTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" BIGINT,
    "rejectReason" TEXT,

    CONSTRAINT "UserBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balanceDelta" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pointsDelta" INTEGER NOT NULL DEFAULT 0,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "referenceId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VipConfig" (
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL,
    "rebateRatioBonus" DECIMAL(65,30) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VipConfig_pkey" PRIMARY KEY ("level")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL,
    "address" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reviewedBy" BIGINT,
    "memo" TEXT,
    "idempotencyKey" TEXT,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTradeReport" (
    "id" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "tradeDate" TIMESTAMP(3) NOT NULL,
    "tradeVolume" DECIMAL(65,30) NOT NULL,
    "baseFeeRate" DECIMAL(65,30) NOT NULL,
    "autoRebate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "manualRebate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "source" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyTradeReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebateSettlement" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "tradeDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "RebateSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ReplayNonce" (
    "nonce" TEXT NOT NULL,
    "userId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplayNonce_pkey" PRIMARY KEY ("nonce")
);

-- CreateIndex
CREATE INDEX "User_inviterId_idx" ON "User"("inviterId");

-- CreateIndex
CREATE UNIQUE INDEX "Exchange_name_key" ON "Exchange"("name");

-- CreateIndex
CREATE INDEX "UserBinding_status_idx" ON "UserBinding"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserBinding_exchangeId_uid_key" ON "UserBinding"("exchangeId", "uid");

-- CreateIndex
CREATE UNIQUE INDEX "UserBinding_userId_exchangeId_key" ON "UserBinding"("userId", "exchangeId");

-- CreateIndex
CREATE INDEX "TransactionLog_userId_type_createdAt_idx" ON "TransactionLog"("userId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalRequest_idempotencyKey_key" ON "WithdrawalRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_status_requestedAt_idx" ON "WithdrawalRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "DailyTradeReport_tradeDate_idx" ON "DailyTradeReport"("tradeDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTradeReport_exchangeId_userId_tradeDate_key" ON "DailyTradeReport"("exchangeId", "userId", "tradeDate");

-- CreateIndex
CREATE UNIQUE INDEX "RebateSettlement_reportId_key" ON "RebateSettlement"("reportId");

-- CreateIndex
CREATE INDEX "RebateSettlement_status_scheduledAt_idx" ON "RebateSettlement"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ReplayNonce_createdAt_idx" ON "ReplayNonce"("createdAt");

-- AddForeignKey
ALTER TABLE "UserBinding" ADD CONSTRAINT "UserBinding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBinding" ADD CONSTRAINT "UserBinding_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLog" ADD CONSTRAINT "TransactionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTradeReport" ADD CONSTRAINT "DailyTradeReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTradeReport" ADD CONSTRAINT "DailyTradeReport_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebateSettlement" ADD CONSTRAINT "RebateSettlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebateSettlement" ADD CONSTRAINT "RebateSettlement_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyTradeReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
