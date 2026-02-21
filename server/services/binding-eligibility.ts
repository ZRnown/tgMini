import { resolveBridgeConfigs, type WeexSyncDeps } from "./weex-sync"

type SupportedExchange = "binance" | "okx" | "bitget" | "gate" | "weex"

const exchangeAlias: Record<string, SupportedExchange> = {
  binance: "binance",
  okx: "okx",
  bitget: "bitget",
  gate: "gate",
  "gate.io": "gate",
  weex: "weex",
}

const normalizeExchange = (value: string): SupportedExchange => {
  const normalized = exchangeAlias[value.trim().toLowerCase()]
  if (!normalized) {
    throw new Error(`Unsupported exchange: ${value}`)
  }
  return normalized
}

const readString = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }
  return ""
}

const readNumber = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (value === undefined || value === null || value === "") {
      continue
    }
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return 0
}

export const verifyUidHasTrade = async (
  exchangeName: string,
  uid: string,
  deps: Pick<WeexSyncDeps, "fetchFn" | "getConfigFn"> = {}
) => {
  const exchange = normalizeExchange(exchangeName)
  const fetchFn = deps.fetchFn ?? ((input, init) => fetch(input, init))
  const getConfigFn =
    deps.getConfigFn ??
    (async (key: string, fallback?: string) => {
      const { getConfig } = await import("./config")
      return getConfig(key, fallback)
    })

  const configs = await resolveBridgeConfigs(getConfigFn)
  const target = configs.find((item) => item.exchange === exchange)
  if (!target) {
    throw new Error(`Bridge config missing for ${exchangeName}`)
  }

  const requestUrl = new URL(target.url)
  requestUrl.searchParams.set("uid", uid)
  requestUrl.searchParams.set("limit", "1")

  const response = await fetchFn(requestUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${target.token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to verify uid trade (${response.status})`)
  }

  const payload = (await response.json()) as { rows?: unknown }
  const rows = Array.isArray(payload.rows) ? payload.rows : []
  return rows.some((row) => {
    if (!row || typeof row !== "object") {
      return false
    }
    const record = row as Record<string, unknown>
    const rowUid = readString(record, ["uid", "userId", "user_id"])
    if (rowUid !== uid) {
      return false
    }
    const rowExchange = readString(record, ["exchange", "exchange_name", "exchangeName"]).toLowerCase()
    const exchangeMatches = !rowExchange || normalizeExchange(rowExchange) === exchange
    if (!exchangeMatches) {
      return false
    }
    const tradeVolume = readNumber(record, ["tradeVolume", "trade_volume", "volume"])
    return tradeVolume > 0
  })
}

