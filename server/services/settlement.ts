import { prisma } from "../prisma"
import { toDecimal } from "../utils/decimal"

export const settleDueRebates = async (now: Date = new Date()) => {
  const due = await prisma.rebateSettlement.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
  })

  let settledCount = 0
  let totalAmount = 0

  for (const item of due) {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: item.userId } })
      if (!user) return

      await tx.user.update({
        where: { id: item.userId },
        data: {
          balance: toDecimal(user.balance).add(item.amount),
        },
      })

      await tx.transactionLog.create({
        data: {
          userId: item.userId,
          type: "REBATE",
          amount: item.amount,
          balanceDelta: item.amount,
          pointsDelta: 0,
          status: "COMPLETED",
          referenceId: item.reportId,
          meta: { settlementId: item.id },
        },
      })

      await tx.rebateSettlement.update({
        where: { id: item.id },
        data: {
          status: "SETTLED",
          settledAt: new Date(),
        },
      })
    })

    settledCount += 1
    totalAmount += Number(item.amount)
  }

  return { settledCount, totalAmount }
}
