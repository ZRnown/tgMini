import { prisma } from "../prisma"
import { addDaysUtc, startOfDayUtc } from "../utils/date"

export const getUserSummary = async (userId: bigint) => {
  const now = new Date()
  const monthStart = startOfDayUtc(addDaysUtc(now, -30))

  const totalRebate = await prisma.transactionLog.aggregate({
    where: { userId, type: "REBATE" },
    _sum: { amount: true },
  })

  const monthlyRebate = await prisma.transactionLog.aggregate({
    where: { userId, type: "REBATE", createdAt: { gte: monthStart } },
    _sum: { amount: true },
  })

  const pendingRebate = await prisma.rebateSettlement.aggregate({
    where: { userId, status: "SCHEDULED" },
    _sum: { amount: true },
  })

  return {
    totalRebate: Number(totalRebate._sum.amount ?? 0),
    monthlyRebate: Number(monthlyRebate._sum.amount ?? 0),
    pendingRebate: Number(pendingRebate._sum.amount ?? 0),
  }
}
