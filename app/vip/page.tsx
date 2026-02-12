"use client"

import { useState } from "react"
import { FloatingDock } from "@/components/floating-dock"
import { cn } from "@/lib/utils"
import { Check, Lock, Gift, Zap, Shield, TrendingUp } from "lucide-react"
import Image from "next/image"
import { TierIcon } from "@/components/tier-icons"
import { useVipConfig } from "@/hooks/use-vip-config"

type VipTier = "bronze" | "silver" | "gold" | "diamond"

const tierOrder: VipTier[] = ["bronze", "silver", "gold", "diamond"]
const tierLabels: Record<VipTier, string> = {
  bronze: "青铜",
  silver: "白银",
  gold: "黄金",
  diamond: "钻石",
}

const tierBenefits: Record<VipTier, string[]> = {
  bronze: ["基础返佣", "签到积分"],
  silver: ["优先客服", "每周奖励", "推荐返利"],
  gold: ["专属空投", "VIP信号", "更高提现额度"],
  diamond: ["专属客户经理", "定制返佣比例", "优先体验新功能"],
}

const tasks = [
  { id: 1, title: "签到增加积分", points: 5, completed: true, icon: Gift },
  { id: 2, title: "每日交易额达标增加积分", points: 30, completed: false, icon: TrendingUp },
  { id: 3, title: "邀请注册并绑定 UID 增加积分", points: 100, completed: false, icon: Zap },
  { id: 4, title: "余额换积分升级 VIP", points: 200, completed: false, icon: Shield },
]

const levelToTier: Record<number, VipTier> = {
  1: "bronze",
  2: "silver",
  3: "gold",
  4: "diamond",
}

const formatBonus = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return "--"
  const normalized = value > 1 ? value : value * 100
  return `${normalized.toFixed(0)}%`
}

export default function VipPage() {
  const [currentLevel] = useState(3)
  const [currentPoints] = useState(2450)
  const [maxPoints] = useState(5000)
  const { configs } = useVipConfig()

  const fallbackConfigs = tierOrder.map((tier, index) => ({
    level: index + 1,
    name: tierLabels[tier],
    minPoints: 0,
    rebateRatioBonus: Number.NaN,
  }))

  const tierConfigs = configs.length ? configs : fallbackConfigs
  const currentTier = levelToTier[currentLevel] ?? "bronze"
  const currentConfig = tierConfigs.find((item) => item.level === currentLevel)
  const nextConfig = tierConfigs.find((item) => item.level === currentLevel + 1)
  const nextName = nextConfig?.name ?? "下一等级"
  const targetPoints = nextConfig?.minPoints ?? maxPoints
  const remainingPoints = Math.max(targetPoints - currentPoints, 0)
  const progressPercent = (currentPoints / maxPoints) * 100

  return (
    <main className="min-h-screen pb-20 bg-background">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Banner */}
        <div className="relative rounded-xl overflow-hidden mb-6">
          <Image src="/banner-vip.jpg" alt="VIP System" width={400} height={120} className="w-full h-28 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent flex items-center px-4">
            <div>
              <p className="text-xs text-gradient-graphite">会员等级</p>
              <p className="text-2xl font-bold text-foreground">升级解锁更多权益</p>
              <p className="text-xs text-yellow-500">当前: {currentConfig?.name ?? tierLabels[currentTier]} 会员</p>
            </div>
          </div>
        </div>

        {/* Current Status Card */}
        <div className="card-base p-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <TierIcon tier={currentTier} className="w-12 h-12" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{currentConfig?.name ?? tierLabels[currentTier]}</h2>
              <p className="text-sm text-muted-foreground">
                额外返佣比例 {formatBonus(currentConfig?.rebateRatioBonus)}（来自 VIP 配置）
              </p>
            </div>
          </div>
            
          {/* Points Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">升级进度</span>
              <span className="font-mono text-primary">{currentPoints.toLocaleString()} / {maxPoints.toLocaleString()} 积分</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              距离 {nextName} 还需 {remainingPoints.toLocaleString()} 积分
            </p>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">等级权益</h3>
          <div className="space-y-2">
            {tierConfigs.map((config) => {
              const tierType = levelToTier[config.level] ?? "bronze"
              const isCurrent = currentLevel === config.level
              const isLocked = currentLevel < config.level
              const benefits = tierBenefits[tierType]
              return (
                <div
                  key={config.level}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-4 transition-all",
                    isCurrent ? "border-primary/40 shadow-[0_0_30px_rgba(110,255,120,0.15)]" : "border-border",
                    isLocked && "opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-info/10",
                      isCurrent ? "opacity-100" : "opacity-40"
                    )}
                  />
                  <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                  <div className="relative flex items-center gap-3">
                    <TierIcon tier={tierType} className="w-10 h-10" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {config.name || tierLabels[tierType]}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary">
                            当前
                          </span>
                        )}
                        {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        最低积分: {config.minPoints?.toLocaleString() ?? "--"}
                      </p>
                    </div>
                    <span className="text-sm font-mono text-gain">
                      +{formatBonus(config.rebateRatioBonus)}
                    </span>
                  </div>
                  <div className="relative mt-3 flex flex-wrap gap-1.5">
                    {benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] border",
                          isCurrent ? "border-primary/30 text-muted-foreground" : "border-border text-muted-foreground"
                        )}
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">积分任务</h3>
          <div className="space-y-2">
            {tasks.map((task) => {
              const Icon = task.icon
              return (
                <div 
                  key={task.id} 
                  className={cn(
                    "card-base p-3",
                    task.completed && "bg-gain/5 border-gain/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      task.completed ? "bg-gain/20 text-gain" : "bg-secondary text-muted-foreground"
                    )}>
                      {task.completed ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm",
                        task.completed ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {task.title}
                      </p>
                    </div>
                    <span className={cn(
                      "font-mono text-sm",
                      task.completed ? "text-gain" : "text-primary"
                    )}>
                      +{task.points} 积分
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <FloatingDock />
    </main>
  )
}
