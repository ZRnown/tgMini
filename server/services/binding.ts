import { prisma } from "../prisma"
import { getBooleanConfig, configDefaults } from "./config"

export const requestBinding = async (userId: bigint, exchangeId: string, uid: string) => {
  const autoApprove = await getBooleanConfig("AUTO_BIND_APPROVE", configDefaults.autoBindApprove)
  const status = autoApprove ? "VERIFIED" : "PENDING"

  return prisma.userBinding.upsert({
    where: {
      userId_exchangeId: {
        userId,
        exchangeId,
      },
    },
    create: {
      userId,
      exchangeId,
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
