import { prisma } from "../prisma"
import { env } from "../env"
import { getVipBonusRatio } from "./vip"
import { addDaysUtc, startOfDayUtc } from "../utils/date"
import { toDecimal } from "../utils/decimal"

export const normalizeRate = (rate: number) => {
  if (rate > 1) return rate / 100
  return rate
}

export const computeManualRebate = async (userId: bigint, tradeVolume: number, baseFeeRate: number) => {
  const bonusRatio = await getVipBonusRatio(userId)
  const normalizedRate = normalizeRate(baseFeeRate)
  return tradeVolume * normalizedRate * bonusRatio
}

export const scheduleSettlement = async (
  reportId: string,
  userId: bigint,
  tradeDate: Date,
  amount: number
) => {
  const tradeDay = startOfDayUtc(tradeDate)
  const scheduledAt = addDaysUtc(tradeDay, 1)
  scheduledAt.setUTCHours(env.settlementHourUtc, 0, 0, 0)

  return prisma.rebateSettlement.upsert({
    where: { reportId },
    create: {
      reportId,
      userId,
      tradeDate: tradeDay,
      amount: toDecimal(amount),
      scheduledAt,
      status: "SCHEDULED",
    },
    update: {
      amount: toDecimal(amount),
      scheduledAt,
      status: "SCHEDULED",
    },
  })
}
