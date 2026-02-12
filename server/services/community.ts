import { prisma } from "../prisma"
import { getNumberConfig, getConfig, configDefaults } from "./config"

export const getVipInviteLink = async (userId: bigint) => {
  const binding = await prisma.userBinding.findFirst({
    where: {
      userId,
      status: "VERIFIED",
    },
  })

  const volumeGate = await getNumberConfig("VIP_GATE_VOLUME", configDefaults.vipGateVolume)
  const volume = await prisma.dailyTradeReport.aggregate({
    where: { userId },
    _sum: { tradeVolume: true },
  })
  const totalVolume = Number(volume._sum.tradeVolume ?? 0)

  const qualifies = Boolean(binding) || totalVolume >= volumeGate
  if (!qualifies) {
    return { qualifies: false, link: null, totalVolume, volumeGate }
  }

  const link = await getConfig("VIP_INVITE_LINK", configDefaults.vipInviteLink)
  return { qualifies: true, link: link ?? null, totalVolume, volumeGate }
}
