
const required = (key: string) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing env: ${key}`)
  }
  return value
}

const optional = (key: string, fallback = "") => process.env[key] ?? fallback

const parseBool = (value: string | undefined, fallback = false) => {
  if (!value) return fallback
  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const parseList = (value: string | undefined) => {
  if (!value) return [] as number[]
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  botToken: required("BOT_TOKEN"),
  adminBotToken: optional("ADMIN_BOT_TOKEN"),
  adminIds: parseList(optional("ADMIN_TG_IDS")),
  apiSigningSecret: required("API_SIGNING_SECRET"),
  autoBindApprove: parseBool(optional("AUTO_BIND_APPROVE"), false),
  minWithdrawalAmount: parseNumber(optional("MIN_WITHDRAWAL_AMOUNT"), 10),
  withdrawalFee: parseNumber(optional("WITHDRAWAL_FEE"), 1),
  vipGateVolume: parseNumber(optional("VIP_GATE_VOLUME"), 0),
  vipInviteLink: optional("VIP_INVITE_LINK"),
  generalGroupLink: optional("GENERAL_GROUP_LINK"),
  weexBridgeUrl: optional("WEEX_BRIDGE_URL"),
  weexBridgeToken: optional("WEEX_BRIDGE_TOKEN"),
  settlementHourUtc: parseNumber(optional("SETTLEMENT_HOUR_UTC"), 3),
  initDataMaxAgeSec: parseNumber(optional("INITDATA_MAX_AGE_SEC"), 86400),
  signatureMaxAgeSec: parseNumber(optional("SIGNATURE_MAX_AGE_SEC"), 300),
}
