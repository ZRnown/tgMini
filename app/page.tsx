"use client"

import { useState } from "react"
import { FloatingDock } from "@/components/floating-dock"
import { cn } from "@/lib/utils"
import { Wallet, Coins, Gift, ArrowRight, Flame, X, Sparkles, Megaphone, Users, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ExchangeLogo } from "@/components/exchange-logos"
import { usePublicConfig } from "@/hooks/use-public-config"

const userData = {
  username: "0x8f3e...a1b2",
  tier: "gold",
  totalRebate: "2,458.32",
  monthlyRebate: "342.15",
  pendingRebate: "89.50",
  checkInStreak: 7,
}

const recentTransactions = [
  { id: 1, exchange: "Binance", amount: "+12.50", type: "现货", time: "2小时前", token: "BTC" },
  { id: 2, exchange: "OKX", amount: "+8.25", type: "合约", time: "5小时前", token: "ETH" },
  { id: 3, exchange: "Bitget", amount: "+15.00", type: "现货", time: "1天前", token: "SOL" },
]

// 签到奖励配置
const checkInRewards = {
  baseReward: 5,
  streakBonus: 2,
  xp: 50,
}

export default function HomePage() {
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardData, setRewardData] = useState({ coins: 0, xp: 0, streak: 0 })
  const { config } = usePublicConfig()
  const communityBotUrl = config.communityBotUrl

  const publicGroups = [
    {
      title: "公告频道",
      desc: "平台公告、规则更新与活动通知",
      href: config.publicGroupAnnounceUrl,
    },
    {
      title: "新手指南",
      desc: "注册绑定教程与常见问题",
      href: config.publicGroupGuideUrl,
    },
    {
      title: "反馈&建议",
      desc: "需求提交与问题反馈入口",
      href: config.publicGroupFeedbackUrl,
    },
  ]

  const privateGroups = [
    {
      title: "免费私密群",
      desc: "所有人申请，机器人自动通过",
      badge: "自动通过",
      href: communityBotUrl ? `${communityBotUrl}?start=group_free` : "",
    },
    {
      title: "付费私密群",
      desc: "绑定 UID 后自动通过，未绑定将被拒绝",
      badge: "需绑定 UID",
      href: communityBotUrl ? `${communityBotUrl}?start=group_paid` : "",
    },
  ]

  const handleCheckIn = () => {
    const newStreak = userData.checkInStreak + 1
    const totalCoins = checkInRewards.baseReward + (newStreak * checkInRewards.streakBonus)
    
    setRewardData({
      coins: totalCoins,
      xp: checkInRewards.xp,
      streak: newStreak,
    })
    setShowRewardModal(true)
    setIsCheckedIn(true)
  }

  return (
    <main className="min-h-screen pb-20 bg-background">
      {/* 签到奖励弹窗 */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="card-base p-4 w-[280px] relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowRewardModal(false)}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">签到成功!</h3>
              <p className="text-xs text-muted-foreground mb-4">恭喜你获得今日签到奖励</p>
              
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between p-2.5 bg-secondary rounded-lg">
                  <span className="text-xs text-muted-foreground">积分奖励</span>
                  <span className="text-base font-bold font-mono text-primary">+{rewardData.coins}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-secondary rounded-lg">
                  <span className="text-xs text-muted-foreground">经验值</span>
                  <span className="text-base font-bold font-mono text-gain">+{rewardData.xp} XP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-secondary rounded-lg">
                  <span className="text-xs text-muted-foreground">连续签到</span>
                  <span className="text-base font-bold font-mono text-foreground">{rewardData.streak} 天</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                连续签到 {rewardData.streak + 1} 天可获得额外 {checkInRewards.streakBonus * 2} 积分奖励
              </p>
              
              <button 
                onClick={() => setShowRewardModal(false)}
                className="mt-3 w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                收下奖励
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border">
              <span className="text-sm font-bold text-primary">G</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{userData.username}</p>
              <p className="text-xs text-muted-foreground">黄金会员</p>
            </div>
          </div>
          <button 
            onClick={handleCheckIn}
            disabled={isCheckedIn}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isCheckedIn 
                ? "bg-secondary text-muted-foreground"
                : "bg-primary text-primary-foreground"
            )}
          >
            <Gift className="w-4 h-4" />
            {isCheckedIn ? "已签到" : "签到"}
          </button>
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-xl overflow-hidden mb-6">
          <Image 
            src="/hero-crypto.jpg" 
            alt="Crypto Trading" 
            width={400} 
            height={160}
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent flex items-center p-4">
            <div>
              <p className="text-xs text-gradient-graphite mb-1">累计返佣</p>
              <p className="text-3xl font-bold text-foreground font-mono">${userData.totalRebate}</p>
              <p className="text-xs text-gain mt-1">+12.5% 本月</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-base p-3">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">本月</span>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">${userData.monthlyRebate}</p>
          </div>
          <div className="card-base p-3">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">待发放</span>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">${userData.pendingRebate}</p>
          </div>
          <div className="card-base p-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-loss" />
              <span className="text-xs text-muted-foreground">连签</span>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">{userData.checkInStreak}天</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card-base p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">最近返佣</span>
            <Link href="/query" className="text-primary text-xs flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ExchangeLogo exchange={tx.exchange} className="w-9 h-9" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.exchange}</p>
                    <p className="text-xs text-muted-foreground">{tx.type} · {tx.token}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-medium text-gain">{tx.amount}</p>
                  <p className="text-xs text-muted-foreground">{tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Public Groups */}
        <div className="card-base p-4 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">公群导航</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            一丨这里展示官方公群与频道用途说明，有需要可直接跳转。
          </p>
          <div className="space-y-2">
            {publicGroups.map((group) => (
              <a
                key={group.title}
                href={group.href || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5 transition-colors",
                  group.href ? "hover:border-primary/30" : "hover:border-border/80"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{group.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{group.desc}</p>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors",
                    group.href
                      ? "border-primary/30 text-primary group-hover:border-primary/50"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {group.href ? "进入" : "待配置"}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Community Groups */}
        <div className="card-base p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">聚合群导航</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            免费群自动通过；付费群需先绑定 UID，机器人校验后放行。
          </p>
          <div className="space-y-2">
            {privateGroups.map((group) => (
              <a
                key={group.title}
                href={group.href || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5 transition-colors",
                  group.href ? "hover:border-primary/30" : "hover:border-border/80"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{group.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{group.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] border border-border text-muted-foreground">
                    {group.badge}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors",
                      group.href
                        ? "border-primary/30 text-primary group-hover:border-primary/50"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {group.href ? "申请" : "待配置"}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <FloatingDock />
    </main>
  )
}
