export type TradeRow = {
  exchange: string
  uid: string
  tradeDate: Date
  tradeVolume: number
  baseFeeRate: number
  autoRebate?: number
}

type ImportSummary = {
  total: number
  inserted: number
  skipped: number
  errors: string[]
}

type FetchLikeResponse = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
  text: () => Promise<string>
}

type FetchLike = (input: string, init?: RequestInit) => Promise<FetchLikeResponse>

type GetConfigLike = (key: string, fallback?: string) => Promise<string | undefined>

type ImportTradeRowsLike = (rows: TradeRow[], source?: string) => Promise<ImportSummary>

type WeexBridgeRow = Record<string, unknown>

type WeexBridgePayload = {
  rows?: unknown
}

const exchangeAliases: Record<string, string> = {
  binance: "Binance",
  okx: "OKX",
  bitget: "Bitget",
  "gate.io": "Gate.io",
  gate: "Gate.io",
  weex: "Weex",
}

export type WeexSyncOptions = {
  from?: Date
  to?: Date
}

export type WeexSyncDeps = {
  fetchFn?: FetchLike
  getConfigFn?: GetConfigLike
  importTradeRowsFn?: ImportTradeRowsLike
}

export type WeexSyncResult = ImportSummary & {
  pulled: number
}

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === "number") {
    const millis = value > 1_000_000_000_000 ? value : value * 1000
    const parsed = new Date(millis)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  if (typeof value === "string") {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }

    const asNumber = Number(value)
    if (Number.isFinite(asNumber)) {
      const millis = asNumber > 1_000_000_000_000 ? asNumber : asNumber * 1000
      const numericDate = new Date(millis)
      return Number.isNaN(numericDate.getTime()) ? null : numericDate
    }
  }

  return null
}

const getRequiredString = (row: WeexBridgeRow, keys: string[], label: string, index: number) => {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }
  throw new Error(`Weex row #${index + 1} missing ${label}`)
}

const getOptionalString = (row: WeexBridgeRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

const getRequiredNumber = (row: WeexBridgeRow, keys: string[], label: string, index: number) => {
  for (const key of keys) {
    const value = row[key]
    const parsed = toNumber(value)
    if (parsed !== null) {
      return parsed
    }
  }
  throw new Error(`Weex row #${index + 1} missing ${label}`)
}

const getOptionalNumber = (row: WeexBridgeRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (value === undefined || value === null || value === "") {
      continue
    }
    const parsed = toNumber(value)
    if (parsed !== null) {
      return parsed
    }
  }
  return undefined
}

const getRequiredDate = (row: WeexBridgeRow, keys: string[], label: string, index: number) => {
  for (const key of keys) {
    const value = row[key]
    const parsed = toDate(value)
    if (parsed) {
      return parsed
    }
  }
  throw new Error(`Weex row #${index + 1} missing ${label}`)
}

const normalizeExchange = (raw: string | undefined, index: number) => {
  if (!raw) {
    return "Weex"
  }

  const exchange = exchangeAliases[raw.toLowerCase()]
  if (!exchange) {
    throw new Error(`Weex row #${index + 1} has unsupported exchange: ${raw}`)
  }

  return exchange
}

const mapBridgeRowToTradeRow = (row: WeexBridgeRow, index: number): TradeRow => {
  const rawExchange = getOptionalString(row, ["exchange", "exchange_name", "exchangeName"])
  const uid = getRequiredString(row, ["uid", "userId", "user_id"], "uid", index)
  const tradeDate = getRequiredDate(row, ["tradeDate", "trade_date", "time", "timestamp"], "tradeDate", index)
  const tradeVolume = getRequiredNumber(row, ["tradeVolume", "trade_volume", "volume"], "tradeVolume", index)
  const baseFeeRate = getRequiredNumber(row, ["baseFeeRate", "base_fee_rate", "feeRate", "fee_rate"], "baseFeeRate", index)
  const autoRebate = getOptionalNumber(row, ["autoRebate", "auto_rebate", "rebate", "rebateAmount"])
  const exchange = normalizeExchange(rawExchange, index)

  return {
    exchange,
    uid,
    tradeDate,
    tradeVolume,
    baseFeeRate,
    autoRebate,
  }
}

const normalizeBridgeRows = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Weex bridge payload invalid: expected JSON object")
  }

  const rows = (payload as WeexBridgePayload).rows
  if (!Array.isArray(rows)) {
    throw new Error("Weex bridge payload invalid: rows must be an array")
  }

  return rows.map((row, index) => {
    if (!row || typeof row !== "object") {
      throw new Error(`Weex row #${index + 1} invalid: expected object`)
    }
    return mapBridgeRowToTradeRow(row as WeexBridgeRow, index)
  })
}

const buildBridgeUrl = (baseUrl: string, options: WeexSyncOptions) => {
  const url = new URL(baseUrl)
  if (options.from) {
    url.searchParams.set("from", options.from.toISOString())
  }
  if (options.to) {
    url.searchParams.set("to", options.to.toISOString())
  }
  return url.toString()
}

const readErrorBody = async (response: FetchLikeResponse) => {
  try {
    const text = await response.text()
    return text.slice(0, 300)
  } catch {
    return ""
  }
}

export const syncWeexTradesFromBridge = async (
  options: WeexSyncOptions = {},
  deps: WeexSyncDeps = {}
): Promise<WeexSyncResult> => {
  const fetchFn = deps.fetchFn ?? ((input, init) => fetch(input, init))
  const getConfigFn =
    deps.getConfigFn ??
    (async (key, fallback) => {
      const { getConfig } = await import("./config")
      return getConfig(key, fallback)
    })
  const importTradeRowsFn =
    deps.importTradeRowsFn ??
    (async (rows, source) => {
      const { importTradeRows } = await import("./import")
      return importTradeRows(rows, source)
    })

  const bridgeUrl = await getConfigFn("WEEX_BRIDGE_URL", process.env.WEEX_BRIDGE_URL ?? "")
  if (!bridgeUrl) {
    throw new Error("WEEX_BRIDGE_URL not configured")
  }

  const bridgeToken = await getConfigFn("WEEX_BRIDGE_TOKEN", process.env.WEEX_BRIDGE_TOKEN ?? "")
  if (!bridgeToken) {
    throw new Error("WEEX_BRIDGE_TOKEN not configured")
  }

  const requestUrl = buildBridgeUrl(bridgeUrl, options)

  const response = await fetchFn(requestUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${bridgeToken}`,
    },
  })

  if (!response.ok) {
    const body = await readErrorBody(response)
    throw new Error(`Weex bridge request failed (${response.status})${body ? `: ${body}` : ""}`)
  }

  const payload = await response.json()
  const rows = normalizeBridgeRows(payload)
  const summary = await importTradeRowsFn(rows, "weex-bridge")

  return {
    pulled: rows.length,
    ...summary,
  }
}
