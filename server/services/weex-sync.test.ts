import assert from "node:assert/strict"
import test from "node:test"
import { syncWeexTradesFromBridge } from "./weex-sync"

test("throws when WEEX_BRIDGE_URL is missing", async () => {
  await assert.rejects(
    () =>
      syncWeexTradesFromBridge(
        {},
        {
          getConfigFn: async () => undefined,
          importTradeRowsFn: async () => ({ total: 0, inserted: 0, skipped: 0, errors: [] }),
          fetchFn: async () => new Response(JSON.stringify({ rows: [] }), { status: 200 }),
        }
      ),
    /WEEX_BRIDGE_URL/
  )
})

test("throws when WEEX_BRIDGE_TOKEN is missing", async () => {
  await assert.rejects(
    () =>
      syncWeexTradesFromBridge(
        {},
        {
          getConfigFn: async (key) => (key === "WEEX_BRIDGE_URL" ? "https://bridge.example.com/sync" : undefined),
          importTradeRowsFn: async () => ({ total: 0, inserted: 0, skipped: 0, errors: [] }),
          fetchFn: async () => new Response(JSON.stringify({ rows: [] }), { status: 200 }),
        }
      ),
    /WEEX_BRIDGE_TOKEN/
  )
})

test("maps bridge rows to exchange trade rows and imports", async () => {
  let requestedUrl = ""
  let requestedAuth = ""
  let importedRows: unknown[] = []
  let importedSource = ""

  const result = await syncWeexTradesFromBridge(
    {
      from: new Date("2026-02-01T00:00:00.000Z"),
      to: new Date("2026-02-02T00:00:00.000Z"),
    },
    {
      getConfigFn: async (key) => {
        if (key === "WEEX_BRIDGE_URL") return "https://bridge.example.com/sync"
        if (key === "WEEX_BRIDGE_TOKEN") return "bot-token"
        return undefined
      },
      fetchFn: async (input, init) => {
        requestedUrl = String(input)
        requestedAuth = String((init?.headers as Record<string, string>)?.Authorization ?? "")
        return new Response(
          JSON.stringify({
            rows: [
              {
                uid: "10001",
                exchange: "binance",
                tradeDate: "2026-02-01T08:00:00.000Z",
                tradeVolume: "1234.56",
                baseFeeRate: "0.001",
                autoRebate: "2.4",
              },
              {
                uid: "10002",
                exchange: "gate",
                tradeDate: 1761955200,
                tradeVolume: 300,
                baseFeeRate: 0.0006,
              },
            ],
          }),
          { status: 200 }
        )
      },
      importTradeRowsFn: async (rows, source) => {
        importedRows = rows
        importedSource = source ?? ""
        return {
          total: rows.length,
          inserted: rows.length,
          skipped: 0,
          errors: [],
        }
      },
    }
  )

  assert.match(requestedUrl, /from=2026-02-01T00%3A00%3A00.000Z/)
  assert.match(requestedUrl, /to=2026-02-02T00%3A00%3A00.000Z/)
  assert.equal(requestedAuth, "Bearer bot-token")

  assert.equal(importedSource, "weex-bridge")
  assert.equal(importedRows.length, 2)

  const first = importedRows[0] as {
    exchange: string
    uid: string
    tradeDate: Date
    tradeVolume: number
    baseFeeRate: number
    autoRebate?: number
  }
  assert.equal(first.exchange, "Binance")
  assert.equal(first.uid, "10001")
  assert.equal(first.tradeVolume, 1234.56)
  assert.equal(first.baseFeeRate, 0.001)
  assert.equal(first.autoRebate, 2.4)
  assert.equal(first.tradeDate.toISOString(), "2026-02-01T08:00:00.000Z")

  const second = importedRows[1] as {
    exchange: string
    tradeDate: Date
    autoRebate?: number
  }
  assert.equal(second.exchange, "Gate.io")
  assert.equal(second.tradeDate.toISOString(), "2025-11-01T00:00:00.000Z")
  assert.equal(second.autoRebate, undefined)

  assert.equal(result.pulled, 2)
  assert.equal(result.total, 2)
  assert.equal(result.inserted, 2)
  assert.equal(result.skipped, 0)
  assert.deepEqual(result.errors, [])
})

test("throws on unsupported exchange value", async () => {
  await assert.rejects(
    () =>
      syncWeexTradesFromBridge(
        {},
        {
          getConfigFn: async (key) => {
            if (key === "WEEX_BRIDGE_URL") return "https://bridge.example.com/sync"
            if (key === "WEEX_BRIDGE_TOKEN") return "bot-token"
            return undefined
          },
          fetchFn: async () =>
            new Response(
              JSON.stringify({
                rows: [
                  {
                    exchange: "unknown-exchange",
                    uid: "10003",
                    tradeDate: "2026-02-01T00:00:00.000Z",
                    tradeVolume: "1",
                    baseFeeRate: "0.001",
                  },
                ],
              }),
              { status: 200 }
            ),
          importTradeRowsFn: async () => ({ total: 0, inserted: 0, skipped: 0, errors: [] }),
        }
      ),
    /unsupported exchange/
  )
})
