"use client"

import { useState } from "react"
import { FloatingDock } from "@/components/floating-dock"
import { cn } from "@/lib/utils"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Filter } from "lucide-react"
import Image from "next/image"
import { ExchangeLogo } from "@/components/exchange-logos"
import { useVipConfig } from "@/hooks/use-vip-config"

const chartData = [
  { date: "1月", rebate: 120 },
  { date: "2月", rebate: 180 },
  { date: "3月", rebate: 150 },
  { date: "4月", rebate: 220 },
  { date: "5月", rebate: 280 },
  { date: "6月", rebate: 342 },
]

const tradeSummary = {
  yesterday: 18520,
  month: 342150,
  total: 1254300,
}

const rebateBreakdown = {
  auto: { yesterday: 32.5, month: 210.4, total: 1280.5 },
  manual: { yesterday: 18.2, month: 131.8, total: 820.3 },
}

const transactions = [
  { id: 1, exchange: "Binance", amount: 12.5, type: "现货", date: "2024-01-15", status: "completed", token: "PEPE" },
  { id: 2, exchange: "OKX", amount: 8.25, type: "合约", date: "2024-01-14", status: "completed", token: "DOGE" },
  { id: 3, exchange: "Weex", amount: 15.0, type: "现货", date: "2024-01-13", status: "pending", token: "SHIB" },
  { id: 4, exchange: "Binance", amount: 22.75, type: "合约", date: "2024-01-12", status: "completed", token: "WIF" },
  { id: 5, exchange: "Gate.io", amount: 5.5, type: "现货", date: "2024-01-11", status: "completed", token: "BONK" },
  { id: 6, exchange: "OKX", amount: 18.0, type: "合约", date: "2024-01-10", status: "completed", token: "FLOKI" },
]

const filterOptions = ["全部", "现货", "合约"]

const formatBonus = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return "--"
  const normalized = value > 1 ? value : value * 100
  return `${normalized.toFixed(0)}%`
}

export default function QueryPage() {
  const [activeFilter, setActiveFilter] = useState("全部")
  const { configs } = useVipConfig()
  const currentVipLevel = 3
  const currentBonus = configs.find((item) => item.level === currentVipLevel)?.rebateRatioBonus
  const bonusLabel = formatBonus(currentBonus)

  const filteredTransactions = transactions.filter(
    (tx) => activeFilter === "全部" || tx.type === activeFilter
  )

  return (
    <main className="min-h-screen pb-20 bg-background">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Banner */}
        <div className="relative rounded-xl overflow-hidden mb-6">
          <Image src="/banner-query.jpg" alt="Data Stream" width={400} height={120} className="w-full h-28 object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent flex items-center px-4">
            <div>
              <p className="text-xs text-gradient-graphite">本月返佣总额</p>
              <p className="text-2xl font-bold font-mono text-foreground">$342.15</p>
              <p className="text-xs text-gain">+18.2% vs 上月</p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="card-base p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">返佣趋势</span>
            <span className="text-xs text-muted-foreground">近6个月</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rebateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(107, 74%, 64%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(107, 74%, 64%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(220, 9%, 56%)', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(220, 9%, 56%)', fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 13%, 11%)',
                    border: '1px solid hsl(220, 13%, 20%)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`$${value}`, '返佣']}
                />
                <Area
                  type="monotone"
                  dataKey="rebate"
                  stroke="hsl(107, 74%, 64%)"
                  strokeWidth={2}
                  fill="url(#rebateGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade Volume */}
        <div className="card-base p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">交易量</span>
            <span className="text-xs text-muted-foreground">当前额外返佣 {bonusLabel}</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-lg bg-secondary/60 p-2.5">
              <p className="text-xs text-muted-foreground">昨日</p>
              <p className="font-mono text-[13px] font-medium text-foreground mt-1">${tradeSummary.yesterday.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-2.5">
              <p className="text-xs text-muted-foreground">本月</p>
              <p className="font-mono text-[13px] font-medium text-foreground mt-1">${tradeSummary.month.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-2.5">
              <p className="text-xs text-muted-foreground">总计</p>
              <p className="font-mono text-[13px] font-medium text-foreground mt-1">${tradeSummary.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Rebate Breakdown */}
        <div className="card-base p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">返佣构成</span>
            <span className="text-xs text-muted-foreground">交易所自动返佣 + 额外手动返佣</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">自动返佣</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>昨日</span>
                  <span className="font-mono text-foreground">${rebateBreakdown.auto.yesterday.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>本月</span>
                  <span className="font-mono text-foreground">${rebateBreakdown.auto.month.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>总计</span>
                  <span className="font-mono text-foreground">${rebateBreakdown.auto.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">手动返佣</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>昨日</span>
                  <span className="font-mono text-foreground">${rebateBreakdown.manual.yesterday.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>本月</span>
                  <span className="font-mono text-foreground">${rebateBreakdown.manual.month.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>总计</span>
                  <span className="font-mono text-foreground">${rebateBreakdown.manual.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="card-base p-3">
              <div className="flex items-center gap-3">
                <ExchangeLogo exchange={tx.exchange} className="w-9 h-9" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{tx.exchange}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      tx.type === "现货" ? "bg-info/20 text-info" : "bg-warning/20 text-warning"
                    )}>
                      {tx.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{tx.token}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-mono font-medium text-gain">+${tx.amount.toFixed(2)}</p>
                  <span className={cn(
                    "text-[10px]",
                    tx.status === "completed" ? "text-gain" : "text-warning"
                  )}>
                    {tx.status === "completed" ? "已到账" : "处理中"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FloatingDock />
    </main>
  )
}
