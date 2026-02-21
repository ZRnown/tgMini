"use client"

import React from "react"
import { useEffect, useState, useRef } from "react"
import { FloatingDock } from "@/components/floating-dock"
import { cn } from "@/lib/utils"
import { 
  Wallet, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History, 
  Settings, 
  LogOut,
  ChevronRight,
  Check,
  Crown,
  MessageCircle
} from "lucide-react"
import Image from "next/image"
import { usePublicConfig } from "@/hooks/use-public-config"
import { withTmaHeaders } from "@/lib/tma"

type WithdrawalItem = {
  id: string
  amount: number
  status: string
  requestedAt: string
}

export default function ProfilePage() {
  const { config } = usePublicConfig()
  const supportBotUrl = config.supportBotUrl
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isSliding, setIsSliding] = useState(false)
  const [slideProgress, setSlideProgress] = useState(0)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalItem[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPages, setHistoryPages] = useState(1)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")

  const availableBalance = 342.15
  const totalWithdrawn = 1250.00

  const handleSlideStart = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return
    setIsSliding(true)
  }

  const handleSlideMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSliding || !sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const progress = Math.min(Math.max((clientX - rect.left - 24) / (rect.width - 48), 0), 1)
    setSlideProgress(progress)
    
    if (progress >= 0.95) {
      setIsConfirmed(true)
      setIsSliding(false)
      setTimeout(() => {
        setIsConfirmed(false)
        setSlideProgress(0)
        setWithdrawAmount("")
      }, 2000)
    }
  }

  const handleSlideEnd = () => {
    if (!isConfirmed) {
      setSlideProgress(0)
    }
    setIsSliding(false)
  }

  const quickAmounts = [50, 100, 200, "全部"]

  useEffect(() => {
    let active = true
    const loadHistory = async () => {
      try {
        setHistoryLoading(true)
        setHistoryError("")
        const response = await fetch(`/api/withdrawals?page=${historyPage}&pageSize=5`, {
          headers: withTmaHeaders(),
          cache: "no-store",
        })
        const payload = (await response.json()) as {
          ok?: boolean
          error?: string
          totalPages?: number
          items?: WithdrawalItem[]
        }
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "提现记录加载失败")
        }
        if (!active) return
        setWithdrawalHistory(Array.isArray(payload.items) ? payload.items : [])
        setHistoryPages(Math.max(payload.totalPages ?? 1, 1))
      } catch (error) {
        if (!active) return
        setHistoryError(error instanceof Error ? error.message : "提现记录加载失败")
      } finally {
        if (active) setHistoryLoading(false)
      }
    }

    loadHistory()
    return () => {
      active = false
    }
  }, [historyPage])

  return (
    <main className="min-h-screen pb-20 bg-background">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Banner */}
        <div className="relative rounded-xl overflow-hidden mb-6">
          <Image src="/banner-profile.jpg" alt="Digital Wallet" width={400} height={120} className="w-full h-28 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent flex items-center px-4">
            <div>
              <p className="text-xs text-gradient-graphite">我的钱包</p>
              <p className="text-2xl font-bold text-foreground">资产管理</p>
              <p className="text-xs text-primary">安全 / 便捷 / 透明</p>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="card-base p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border">
              <span className="text-xl font-bold text-primary">G</span>
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">0x8f3e...a1b2</h1>
              <div className="flex items-center gap-2 mt-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-500 font-medium">黄金会员</span>
              </div>
            </div>
            <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="card-base p-4 mb-6 border-primary/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">可提现余额</p>
              <p className="text-2xl font-bold font-mono text-foreground">${availableBalance.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-gain" />
              <div>
                <p className="text-xs text-muted-foreground">累计收益</p>
                <p className="font-mono font-medium text-gain">${(availableBalance + totalWithdrawn).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="w-4 h-4 text-info" />
              <div>
                <p className="text-xs text-muted-foreground">已提现</p>
                <p className="font-mono font-medium text-info">${totalWithdrawn.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="card-base p-4 mb-6">
          <h3 className="font-medium text-foreground mb-4">提现</h3>
          
          {/* Amount Input */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">$</span>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-secondary border border-border rounded-lg py-3 pl-10 pr-4 text-xl font-mono font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="flex gap-2 mb-4">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setWithdrawAmount(amount === "全部" ? availableBalance.toString() : amount.toString())}
                className="flex-1 py-2 bg-secondary rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {amount === "全部" ? "全部" : `$${amount}`}
              </button>
            ))}
          </div>
          
          {/* Slide to Confirm */}
          <div 
            ref={sliderRef}
            className={cn(
              "relative h-12 rounded-lg overflow-hidden transition-colors",
              isConfirmed ? "bg-gain/20" : "bg-secondary"
            )}
            onMouseMove={handleSlideMove}
            onMouseUp={handleSlideEnd}
            onMouseLeave={handleSlideEnd}
            onTouchMove={handleSlideMove}
            onTouchEnd={handleSlideEnd}
          >
            <div 
              className="absolute inset-y-0 left-0 bg-primary/20 transition-all"
              style={{ width: `${slideProgress * 100}%` }}
            />
            
            <span className={cn(
              "absolute inset-0 flex items-center justify-center text-sm font-medium transition-opacity",
              isConfirmed ? "text-gain" : "text-muted-foreground"
            )}>
              {isConfirmed ? "提现申请已提交" : "滑动确认提现"}
            </span>
            
            {!isConfirmed && (
              <div 
                className={cn(
                  "absolute top-1 bottom-1 w-10 rounded-md flex items-center justify-center transition-all cursor-grab active:cursor-grabbing",
                  withdrawAmount && parseFloat(withdrawAmount) > 0 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
                style={{ left: `${Math.max(4, slideProgress * (100 - 14))}%` }}
                onMouseDown={handleSlideStart}
                onTouchStart={handleSlideStart}
              >
                {isConfirmed ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">提现记录</span>
          </div>
          
          <div className="space-y-3">
            {withdrawalHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium text-foreground">-${item.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.requestedAt).toISOString().slice(0, 10)} · USDT
                  </p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-medium",
                  item.status === "PAID" 
                    ? "bg-gain/20 text-gain" 
                    : "bg-warning/20 text-warning"
                )}>
                  {item.status === "PAID" ? "已完成" : "处理中"}
                </span>
              </div>
            ))}
            {historyLoading && (
              <p className="text-xs text-muted-foreground">加载中...</p>
            )}
            {!historyLoading && withdrawalHistory.length === 0 && (
              <p className="text-xs text-muted-foreground">暂无提现记录</p>
            )}
            {historyError && (
              <p className="text-xs text-loss">{historyError}</p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-md border border-border px-3 py-1 text-xs text-foreground disabled:opacity-40"
            >
              上一页
            </button>
            <span className="text-xs text-muted-foreground">
              第 {historyPage} / {historyPages} 页
            </span>
            <button
              disabled={historyPage >= historyPages}
              onClick={() => setHistoryPage((prev) => Math.min(prev + 1, historyPages))}
              className="rounded-md border border-border px-3 py-1 text-xs text-foreground disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="card-base p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">联系客服</p>
                <p className="text-xs text-muted-foreground">双向机器人，支持人工跟进</p>
              </div>
            </div>
            <a
              href={supportBotUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                supportBotUrl
                  ? "border-border text-foreground hover:border-primary/40"
                  : "border-border text-foreground hover:border-primary/30"
              )}
            >
              {supportBotUrl ? "立即联系" : "待配置"}
            </a>
          </div>
        </div>

        {/* Logout */}
        <button className="w-full mt-6 py-3 flex items-center justify-center gap-2 text-loss border border-border hover:border-loss/40 hover:bg-loss/10 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="font-medium">退出登录</span>
        </button>
      </div>

      <FloatingDock />
    </main>
  )
}
