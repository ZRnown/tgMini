import { prisma } from "../prisma"
import { env } from "../env"

export const getConfig = async (key: string, fallback?: string) => {
  const record = await prisma.config.findUnique({ where: { key } })
  return record?.value ?? fallback
}

export const getNumberConfig = async (key: string, fallback: number) => {
  const raw = await getConfig(key)
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const getBooleanConfig = async (key: string, fallback: boolean) => {
  const raw = await getConfig(key)
  if (!raw) return fallback
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase())
}

export const setConfig = async (key: string, value: string) => {
  return prisma.config.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}

export const configDefaults = {
  minWithdrawalAmount: env.minWithdrawalAmount,
  withdrawalFee: env.withdrawalFee,
  autoBindApprove: env.autoBindApprove,
  vipGateVolume: env.vipGateVolume,
  vipInviteLink: env.vipInviteLink,
  generalGroupLink: env.generalGroupLink,
  weexBridgeUrl: env.weexBridgeUrl,
  weexBridgeToken: env.weexBridgeToken,
}
