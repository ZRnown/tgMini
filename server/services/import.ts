import { parse } from "csv-parse/sync"
import * as XLSX from "xlsx"
import { prisma } from "../prisma"
import { computeManualRebate, normalizeRate, scheduleSettlement } from "./rebate"
import { toDecimal } from "../utils/decimal"
import { startOfDayUtc } from "../utils/date"

export type TradeRow = {
  exchange: string
  uid: string
  tradeDate: Date
  tradeVolume: number
  baseFeeRate: number
  autoRebate?: number
}

const normalizeHeader = (value: string) => value.trim().toLowerCase()

const pick = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key]
    }
  }
  return undefined
}

const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return null
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
  }
  const str = String(value)
  const parsed = new Date(str)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const parseTradeFile = (buffer: Buffer, filename: string): TradeRow[] => {
  const lower = filename.toLowerCase()
  let rows: Record<string, unknown>[] = []

  if (lower.endsWith(".csv")) {
    const parsed = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, unknown>[]
    rows = parsed
  } else {
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(sheet, { raw: true }) as Record<string, unknown>[]
    rows = json
  }

  return rows
    .map((row) => {
      const normalized: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row)) {
        normalized[normalizeHeader(key)] = value
      }

      const exchange = pick(normalized, ["exchange", "exchange_name", "交易所"]) as string | undefined
      const uid = pick(normalized, ["uid", "user_uid", "用户uid", "账户uid"]) as string | undefined
      const tradeDateValue = pick(normalized, ["trade_date", "date", "日期", "tradeDate"])
      const tradeVolumeValue = pick(normalized, ["trade_volume", "volume", "交易量", "tradeVolume"])
      const baseFeeRateValue = pick(normalized, ["base_fee_rate", "fee_rate", "费率", "baseFeeRate"])
      const autoRebateValue = pick(normalized, ["auto_rebate", "auto", "自动返佣"])

      if (!exchange || !uid || !tradeDateValue || !tradeVolumeValue || !baseFeeRateValue) {
        return null
      }

      const tradeDate = parseDateValue(tradeDateValue)
      if (!tradeDate) return null

      const tradeVolume = Number(tradeVolumeValue)
      const baseFeeRate = Number(baseFeeRateValue)
      const autoRebate = autoRebateValue !== undefined ? Number(autoRebateValue) : undefined

      if (!Number.isFinite(tradeVolume) || !Number.isFinite(baseFeeRate)) return null

      return {
        exchange: String(exchange).trim(),
        uid: String(uid).trim(),
        tradeDate,
        tradeVolume,
        baseFeeRate,
        autoRebate: Number.isFinite(autoRebate) ? autoRebate : undefined,
      } as TradeRow
    })
    .filter((row): row is TradeRow => row !== null)
}

export const importTradeRows = async (rows: TradeRow[], source = "upload") => {
  const summary = {
    total: rows.length,
    inserted: 0,
    skipped: 0,
    errors: [] as string[],
  }

  const exchangeCache = new Map<string, string>()

  for (const row of rows) {
    try {
      let exchangeId = exchangeCache.get(row.exchange)
      if (!exchangeId) {
        const exchange = await prisma.exchange.upsert({
          where: { name: row.exchange },
          create: { name: row.exchange },
          update: {},
        })
        exchangeId = exchange.id
        exchangeCache.set(row.exchange, exchangeId)
      }

      const binding = await prisma.userBinding.findFirst({
        where: {
          exchangeId,
          uid: row.uid,
          status: "VERIFIED",
        },
      })

      if (!binding) {
        summary.skipped += 1
        summary.errors.push(`UID ${row.uid} not bound on ${row.exchange}`)
        continue
      }

      const manualRebate = await computeManualRebate(
        binding.userId,
        row.tradeVolume,
        row.baseFeeRate
      )

      const tradeDate = startOfDayUtc(row.tradeDate)

      const report = await prisma.dailyTradeReport.upsert({
        where: {
          exchangeId_userId_tradeDate: {
            exchangeId,
            userId: binding.userId,
            tradeDate,
          },
        },
        create: {
          exchangeId,
          userId: binding.userId,
          tradeDate,
          tradeVolume: toDecimal(row.tradeVolume),
          baseFeeRate: toDecimal(normalizeRate(row.baseFeeRate)),
          autoRebate: toDecimal(row.autoRebate ?? 0),
          manualRebate: toDecimal(manualRebate),
          source,
          raw: row,
        },
        update: {
          tradeVolume: toDecimal(row.tradeVolume),
          baseFeeRate: toDecimal(normalizeRate(row.baseFeeRate)),
          autoRebate: toDecimal(row.autoRebate ?? 0),
          manualRebate: toDecimal(manualRebate),
          source,
          raw: row,
        },
      })

      await scheduleSettlement(report.id, binding.userId, tradeDate, manualRebate)

      summary.inserted += 1
    } catch (error) {
      summary.skipped += 1
      summary.errors.push(error instanceof Error ? error.message : String(error))
    }
  }

  return summary
}
