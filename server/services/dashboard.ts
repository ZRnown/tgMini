import { prisma } from "../prisma"
import { startOfDayUtc } from "../utils/date"

export const getDashboard = async () => {
  const today = startOfDayUtc(new Date())

  const tradeVolume = await prisma.dailyTradeReport.aggregate({
    where: { tradeDate: { gte: today } },
    _sum: { tradeVolume: true },
  })

  const pendingBindings = await prisma.userBinding.count({ where: { status: "PENDING" } })
  const pendingWithdrawals = await prisma.withdrawalRequest.count({ where: { status: "PENDING" } })

  return {
    todayTradeVolume: Number(tradeVolume._sum.tradeVolume ?? 0),
    pendingBindings,
    pendingWithdrawals,
  }
}
