import { prisma } from "../prisma"

export const getVipConfigs = async () => {
  return prisma.vipConfig.findMany({ orderBy: { level: "asc" } })
}

export const resolveVipLevel = (points: number, configs: { level: number; minPoints: number }[]) => {
  let level = 1
  for (const config of configs) {
    if (points >= config.minPoints) {
      level = config.level
    }
  }
  return level
}

export const syncUserVipLevel = async (userId: bigint) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null

  const configs = await getVipConfigs()
  const nextLevel = resolveVipLevel(user.points, configs)
  if (nextLevel !== user.vipLevel) {
    return prisma.user.update({ where: { id: userId }, data: { vipLevel: nextLevel } })
  }
  return user
}

export const getVipBonusRatio = async (userId: bigint) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return 0
  const config = await prisma.vipConfig.findUnique({ where: { level: user.vipLevel } })
  return config ? Number(config.rebateRatioBonus) : 0
}
