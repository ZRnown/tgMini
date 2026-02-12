import { prisma } from "../prisma"
import { getNumberConfig, configDefaults } from "./config"
import { toDecimal, toNumber } from "../utils/decimal"
import { sendTelegramMessage } from "./notify"

export const createWithdrawal = async (
  userId: bigint,
  amount: number,
  address: string,
  idempotencyKey?: string
) => {
  const minAmount = await getNumberConfig("MIN_WITHDRAWAL_AMOUNT", configDefaults.minWithdrawalAmount)
  const fee = await getNumberConfig("WITHDRAWAL_FEE", configDefaults.withdrawalFee)

  if (amount < minAmount) {
    throw new Error(`Minimum withdrawal is ${minAmount}`)
  }

  return prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existing = await tx.withdrawalRequest.findUnique({ where: { idempotencyKey } })
      if (existing) return existing
    }

    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error("User not found")

    const totalDeduction = amount + fee
    if (toNumber(user.balance) < totalDeduction) {
      throw new Error("Insufficient balance")
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        balance: toDecimal(user.balance).sub(totalDeduction),
        balanceFrozen: toDecimal(user.balanceFrozen).add(amount),
      },
    })

    const withdrawal = await tx.withdrawalRequest.create({
      data: {
        userId,
        amount: toDecimal(amount),
        fee: toDecimal(fee),
        address,
        status: "PENDING",
        idempotencyKey: idempotencyKey ?? null,
      },
    })

    await tx.transactionLog.create({
      data: {
        userId,
        type: "WITHDRAWAL",
        amount: toDecimal(-totalDeduction),
        balanceDelta: toDecimal(-totalDeduction),
        pointsDelta: 0,
        status: "COMPLETED",
        referenceId: withdrawal.id,
        meta: { fee },
      },
    })

    await sendTelegramMessage(
      userId,
      `提现申请已提交：$${amount.toFixed(2)}，手续费 $${fee.toFixed(2)}。`
    )

    return { withdrawal, balance: updated.balance, balanceFrozen: updated.balanceFrozen }
  })
}

export const approveWithdrawal = async (id: string, reviewerId: bigint) => {
  return prisma.withdrawalRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      reviewedBy: reviewerId,
    },
  })
}

export const rejectWithdrawal = async (id: string, reviewerId: bigint, reason?: string) => {
  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawalRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: reviewerId,
        memo: reason ?? "",
      },
    })

    const user = await tx.user.findUnique({ where: { id: withdrawal.userId } })
    if (!user) return withdrawal

    const totalRefund = toNumber(withdrawal.amount) + toNumber(withdrawal.fee)

    await tx.user.update({
      where: { id: withdrawal.userId },
      data: {
        balance: toDecimal(user.balance).add(totalRefund),
        balanceFrozen: toDecimal(user.balanceFrozen).sub(toNumber(withdrawal.amount)),
      },
    })

    await tx.transactionLog.create({
      data: {
        userId: withdrawal.userId,
        type: "WITHDRAWAL",
        amount: toDecimal(totalRefund),
        balanceDelta: toDecimal(totalRefund),
        pointsDelta: 0,
        status: "COMPLETED",
        referenceId: withdrawal.id,
        meta: { action: "refund" },
      },
    })

    await sendTelegramMessage(
      withdrawal.userId,
      `提现申请已拒绝，金额已退回：$${totalRefund.toFixed(2)}。`
    )

    return withdrawal
  })
}

export const markWithdrawalPaid = async (id: string, reviewerId: bigint, txHash?: string) => {
  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawalRequest.update({
      where: { id },
      data: {
        status: "PAID",
        reviewedBy: reviewerId,
        txHash: txHash ?? null,
        completedAt: new Date(),
      },
    })

    const user = await tx.user.findUnique({ where: { id: withdrawal.userId } })
    if (user) {
      await tx.user.update({
        where: { id: withdrawal.userId },
        data: {
          balanceFrozen: toDecimal(user.balanceFrozen).sub(toNumber(withdrawal.amount)),
        },
      })
    }

    await sendTelegramMessage(
      withdrawal.userId,
      `提现已完成：$${toNumber(withdrawal.amount).toFixed(2)}。`
    )

    return withdrawal
  })
}
