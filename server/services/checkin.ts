import { prisma } from "../prisma"
import { addDaysUtc, startOfDayUtc } from "../utils/date"
import { syncUserVipLevel } from "./vip"

const BASE_POINTS = Number(process.env.CHECKIN_BASE_POINTS ?? 5)
const STREAK_BONUS = Number(process.env.CHECKIN_STREAK_BONUS ?? 2)

export const checkIn = async (userId: bigint) => {
  const today = startOfDayUtc(new Date())

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error("User not found")

    if (user.lastCheckInDate) {
      const last = startOfDayUtc(new Date(user.lastCheckInDate))
      if (last.getTime() === today.getTime()) {
        throw new Error("Already checked in today")
      }
    }

    const yesterday = addDaysUtc(today, -1)
    const lastCheckIn = user.lastCheckInDate ? startOfDayUtc(new Date(user.lastCheckInDate)) : null

    const nextStreak = lastCheckIn && lastCheckIn.getTime() === yesterday.getTime()
      ? user.checkInStreak + 1
      : 1

    const pointsEarned = BASE_POINTS + nextStreak * STREAK_BONUS

    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        checkInStreak: nextStreak,
        lastCheckInDate: today,
        points: user.points + pointsEarned,
      },
    })

    await tx.transactionLog.create({
      data: {
        userId,
        type: "CHECKIN",
        amount: 0,
        balanceDelta: 0,
        pointsDelta: pointsEarned,
        status: "COMPLETED",
        referenceId: "checkin",
        meta: { streak: nextStreak },
      },
    })

    await syncUserVipLevel(userId)

    return {
      pointsEarned,
      streak: nextStreak,
      totalPoints: updated.points,
    }
  })
}
