import { prisma } from "../prisma"
import { toDecimal } from "../utils/decimal"
import { syncUserVipLevel } from "./vip"

export const adjustUser = async (
  userId: bigint,
  balanceDelta: number,
  pointsDelta: number,
  reason: string,
  reviewerId: bigint
) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error("User not found")

    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        balance: toDecimal(user.balance).add(balanceDelta),
        points: user.points + pointsDelta,
      },
    })

    await tx.transactionLog.create({
      data: {
        userId,
        type: "ADJUSTMENT",
        amount: toDecimal(balanceDelta),
        balanceDelta: toDecimal(balanceDelta),
        pointsDelta,
        status: "COMPLETED",
        referenceId: reviewerId.toString(),
        meta: { reason },
      },
    })

    await syncUserVipLevel(userId)

    return updated
  })
}
