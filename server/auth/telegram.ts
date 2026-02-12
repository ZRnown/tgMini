import crypto from "crypto"
import { env } from "../env"
import { prisma } from "../prisma"
import { NextRequest } from "next/server"

export type TelegramUser = {
  id: bigint
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
}

const parseInitData = (initData: string) => {
  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  params.delete("hash")
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
  return { params, hash, dataCheckString }
}

const verifyInitDataHash = (dataCheckString: string, hash: string) => {
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(env.botToken)
    .digest()

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(hash, "hex")
  )
}

export const parseTelegramUser = (initData: string): TelegramUser => {
  const { params, hash, dataCheckString } = parseInitData(initData)
  if (!hash) {
    throw new Error("Missing Telegram initData hash")
  }
  if (!verifyInitDataHash(dataCheckString, hash)) {
    throw new Error("Invalid Telegram initData hash")
  }

  const authDate = Number(params.get("auth_date"))
  if (!Number.isFinite(authDate)) {
    throw new Error("Invalid auth_date")
  }
  const ageSeconds = Math.abs(Date.now() / 1000 - authDate)
  if (ageSeconds > env.initDataMaxAgeSec) {
    throw new Error("Telegram initData expired")
  }

  const userJson = params.get("user")
  if (!userJson) {
    throw new Error("Missing Telegram user payload")
  }
  const user = JSON.parse(userJson)
  return {
    id: BigInt(user.id),
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    photo_url: user.photo_url,
  }
}

export const requireTelegramUser = async (request: NextRequest) => {
  const initData =
    request.headers.get("x-telegram-init-data") ||
    request.headers.get("x-tma-init-data") ||
    request.nextUrl.searchParams.get("initData") ||
    ""

  if (!initData) {
    const devId = process.env.DEV_TG_ID
    if (process.env.NODE_ENV !== "production" && devId) {
      const username = process.env.DEV_TG_USERNAME
      const user = await prisma.user.upsert({
        where: { id: BigInt(devId) },
        create: {
          id: BigInt(devId),
          username: username ?? undefined,
        },
        update: {
          username: username ?? undefined,
        },
      })
      return { user, telegramUser: { id: BigInt(devId), username } }
    }
    throw new Error("Missing Telegram init data")
  }

  const telegramUser = parseTelegramUser(initData)

  const user = await prisma.user.upsert({
    where: { id: telegramUser.id },
    create: {
      id: telegramUser.id,
      username: telegramUser.username,
    },
    update: {
      username: telegramUser.username ?? undefined,
    },
  })

  return { user, telegramUser }
}

export const assertAdmin = (telegramUserId: bigint) => {
  const adminIds = env.adminIds.map((id) => BigInt(id))
  if (!adminIds.includes(telegramUserId)) {
    throw new Error("Forbidden: admin only")
  }
}
