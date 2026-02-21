import { prisma } from "../prisma"
import { getBooleanConfig, configDefaults } from "./config"
import { verifyUidHasTrade } from "./binding-eligibility"

const normalizeExchangeName = (value: string) => {
  const key = value.trim().toLowerCase()
  if (key === "gate" || key === "gate.io") return "Gate.io"
  if (key === "okx") return "OKX"
  if (key === "binance") return "Binance"
  if (key === "bitget") return "Bitget"
  if (key === "weex") return "Weex"
  throw new Error(`Unsupported exchange: ${value}`)
}

export const requestBinding = async (userId: bigint, exchangeName: string, uid: string) => {
  const normalizedName = normalizeExchangeName(exchangeName)
  const hasTrade = await verifyUidHasTrade(normalizedName, uid)
  if (!hasTrade) {
    throw new Error("该 UID 暂无有效交易记录，请先完成至少一笔交易后再绑定。")
  }

  const exchange = await prisma.exchange.upsert({
    where: { name: normalizedName },
    create: { name: normalizedName },
    update: {},
  })

  const autoApprove = await getBooleanConfig("AUTO_BIND_APPROVE", configDefaults.autoBindApprove)
  const status = autoApprove ? "VERIFIED" : "PENDING"

  return prisma.userBinding.upsert({
    where: {
      userId_exchangeId: {
        userId,
        exchangeId: exchange.id,
      },
    },
    create: {
      userId,
      exchangeId: exchange.id,
      uid,
      status,
      reviewedAt: autoApprove ? new Date() : null,
      reviewedBy: autoApprove ? userId : null,
    },
    update: {
      uid,
      status,
    },
  })
}

export const approveBinding = async (bindingId: string, reviewerId: bigint) => {
  return prisma.userBinding.update({
    where: { id: bindingId },
    data: {
      status: "VERIFIED",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectReason: null,
    },
  })
}

export const rejectBinding = async (bindingId: string, reviewerId: bigint, reason?: string) => {
  return prisma.userBinding.update({
    where: { id: bindingId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectReason: reason ?? "",
    },
  })
}
