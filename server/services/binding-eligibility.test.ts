import assert from "node:assert/strict"
import test from "node:test"
import { verifyUidHasTrade } from "./binding-eligibility"

test("returns true when bridge has matching uid with positive trade volume", async () => {
  const ok = await verifyUidHasTrade("binance", "10001", {
    getConfigFn: async (key) => {
      if (key === "BINANCE_BRIDGE_URL") return "https://bridge.example.com/binance"
      if (key === "BINANCE_BRIDGE_TOKEN") return "token-a"
      return undefined
    },
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          rows: [{ exchange: "binance", uid: "10001", tradeVolume: "1.2" }],
        }),
        { status: 200 }
      ),
  })

  assert.equal(ok, true)
})

test("returns false when uid has no trade", async () => {
  const ok = await verifyUidHasTrade("okx", "10002", {
    getConfigFn: async (key) => {
      if (key === "OKX_BRIDGE_URL") return "https://bridge.example.com/okx"
      if (key === "OKX_BRIDGE_TOKEN") return "token-b"
      return undefined
    },
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          rows: [{ exchange: "okx", uid: "10002", tradeVolume: "0" }],
        }),
        { status: 200 }
      ),
  })

  assert.equal(ok, false)
})

test("throws when exchange bridge config is missing", async () => {
  await assert.rejects(
    () =>
      verifyUidHasTrade("weex", "10003", {
        getConfigFn: async () => undefined,
        fetchFn: async () => new Response(JSON.stringify({ rows: [] }), { status: 200 }),
      }),
    /No exchange bridge configured/
  )
})
