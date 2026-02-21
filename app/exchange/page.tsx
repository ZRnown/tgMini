"use client"

import { useState } from "react"
import { FloatingDock } from "@/components/floating-dock"
import { cn } from "@/lib/utils"
import { Check, Link2, Loader2, Plus, ExternalLink, Info, X } from "lucide-react"
import Image from "next/image"
import { ExchangeLogo } from "@/components/exchange-logos"
import { withTmaHeaders } from "@/lib/tma"

type ConnectionStatus = "unbound" | "pending" | "bound"

interface Exchange {
  id: string
  name: string
  status: ConnectionStatus
  rebateRate?: string
  uid?: string
}

const exchanges: Exchange[] = [
  { id: "binance", name: "Binance", status: "bound", rebateRate: "20%", uid: "38912012" },
  { id: "okx", name: "OKX", status: "bound", rebateRate: "18%", uid: "22094831" },
  { id: "weex", name: "Weex", status: "pending", uid: "56219877" },
  { id: "bitget", name: "Bitget", status: "unbound" },
  { id: "gate", name: "Gate.io", status: "unbound" },
]

export default function ExchangePage() {
  const [exchangeList, setExchangeList] = useState(exchanges)
  const [bindTarget, setBindTarget] = useState<Exchange | null>(null)
  const [bindUid, setBindUid] = useState("")
  const [bindError, setBindError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const openBindModal = (exchange: Exchange) => {
    setBindTarget(exchange)
    setBindUid("")
    setBindError("")
  }

  const handleBindConfirm = async () => {
    if (!bindTarget) return
    const uid = bindUid.trim()
    if (!uid) {
      setBindError("请输入 UID")
      return
    }
    try {
      setSubmitting(true)
      setBindError("")
      const response = await fetch("/api/bindings", {
        method: "POST",
        headers: withTmaHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ exchange: bindTarget.name, uid }),
      })
      const payload = (await response.json()) as { ok?: boolean; error?: string; binding?: { status?: ConnectionStatus } }
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "绑定失败")
      }

      const status = payload.binding?.status === "VERIFIED" ? "bound" : "pending"
      setExchangeList((prev) =>
        prev.map((ex) =>
          ex.id === bindTarget.id ? { ...ex, status: status as ConnectionStatus, uid } : ex
        )
      )
      setBindTarget(null)
    } catch (error) {
      setBindError(error instanceof Error ? error.message : "绑定失败")
    } finally {
      setSubmitting(false)
    }
  }

  const boundCount = exchangeList.filter((ex) => ex.status === "bound").length
  const boundExchanges = exchangeList.filter((ex) => ex.status === "bound" && ex.uid)

  return (
    <main className="min-h-screen pb-20 bg-background">
      {bindTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="card-base w-[320px] p-5 relative">
            <button
              onClick={() => setBindTarget(null)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <ExchangeLogo exchange={bindTarget.name} className="w-10 h-10" />
              <div>
                <p className="text-sm font-medium text-foreground">绑定 {bindTarget.name}</p>
                <p className="text-xs text-muted-foreground">请输入交易所 UID 进行审核</p>
              </div>
            </div>
            <input
              value={bindUid}
              onChange={(e) => {
                setBindUid(e.target.value)
                setBindError("")
              }}
              placeholder="请输入 UID"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              提示：UID 通常在交易所个人中心-账户信息中查看，提交后进入审核。
            </p>
            {bindError && (
              <p className="mt-2 text-xs text-loss">{bindError}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setBindTarget(null)}
                className="flex-1 rounded-lg border border-border py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                取消
              </button>
              <button
                onClick={handleBindConfirm}
                disabled={submitting}
                className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground"
              >
                {submitting ? "提交中..." : "提交绑定"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Banner */}
        <div className="relative rounded-xl overflow-hidden mb-6">
          <Image src="/banner-exchange.jpg" alt="Exchange Network" width={400} height={120} className="w-full h-28 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent flex items-center px-4">
            <div>
              <p className="text-xs text-gradient-graphite">绑定交易所</p>
              <p className="text-2xl font-bold text-foreground">连接你的账户</p>
              <p className="text-xs text-primary">获得高达 25% 返佣</p>
            </div>
          </div>
        </div>

        {/* Binding Steps */}
        <div className="card-base p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">绑定流程</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
            <div className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2 text-center">
              1. 点击绑定
            </div>
            <div className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2 text-center">
              2. 输入 UID
            </div>
            <div className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2 text-center">
              3. 等待审核
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            UID 仅用于核验代理关系，审核通过后开始计算返佣。
          </p>
        </div>

        {/* Progress Bar */}
        <div className="card-base p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(boundCount / exchangeList.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                已绑定 {boundCount} / {exchangeList.length} 个交易所
              </p>
              {boundExchanges.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {boundExchanges.map((ex) => (
                    <span key={ex.id} className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {ex.name} · {ex.uid}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-muted-foreground">暂无已绑定交易所</p>
              )}
            </div>
          </div>
        </div>

        {/* Exchange List */}
        <div className="space-y-2">
          {exchangeList.map((exchange) => (
            <div 
              key={exchange.id}
              className={cn(
                "card-base p-4",
                exchange.status === "bound" && "border-primary/30"
              )}
            >
              <div className="flex items-center gap-3">
                <ExchangeLogo exchange={exchange.name} className="w-11 h-11" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{exchange.name}</span>
                    {exchange.status === "bound" && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  {exchange.rebateRate && (
                    <p className="text-sm text-primary font-mono">
                      返佣比例: {exchange.rebateRate}
                    </p>
                  )}
                  {(exchange.status === "bound" || exchange.status === "pending") && (
                    <p className="text-xs text-muted-foreground">
                      UID: <span className="font-mono text-foreground">{exchange.uid ?? "--"}</span>
                    </p>
                  )}
                  {exchange.status === "pending" && (
                    <p className="text-xs text-warning">绑定验证中...</p>
                  )}
                </div>
                
                <button
                  onClick={() => openBindModal(exchange)}
                  disabled={exchange.status !== "unbound"}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    exchange.status === "bound" && "bg-primary/20 text-primary",
                    exchange.status === "pending" && "bg-warning/20 text-warning",
                    exchange.status === "unbound" && "bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {exchange.status === "bound" && <><Check className="w-3.5 h-3.5" /> 已绑定</>}
                  {exchange.status === "pending" && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 绑定中</>}
                  {exchange.status === "unbound" && <><Plus className="w-3.5 h-3.5" /> 绑定</>}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      <FloatingDock />
    </main>
  )
}
