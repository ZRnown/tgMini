import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type TierBadgeProps = {
  className?: string
  ringFrom: string
  ringTo: string
  glow: string
  accent: string
  children: ReactNode
}

function TierBadge({
  className = "w-10 h-10",
  ringFrom,
  ringTo,
  glow,
  accent,
  children,
}: TierBadgeProps) {
  return (
    <div
      className={cn("rounded-2xl p-[1px]", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${ringFrom} 0%, ${ringTo} 100%)` }}
    >
      <div className="relative w-full h-full rounded-[15px] bg-[#0f1116] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{ background: `radial-gradient(60% 60% at 30% 20%, ${glow} 0%, transparent 65%)` }}
        />
        <div
          className="absolute inset-0 opacity-45"
          style={{ background: `radial-gradient(70% 70% at 80% 80%, ${accent} 0%, transparent 70%)` }}
        />
        {children}
      </div>
    </div>
  )
}

export function BronzeTierIcon({ className }: { className?: string }) {
  return (
    <TierBadge
      className={className}
      ringFrom="#c08b5a"
      ringTo="#5f3b22"
      glow="rgba(240, 199, 102, 0.35)"
      accent="rgba(95, 59, 34, 0.6)"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7.6" fill="#2a1c13" stroke="#c08b5a" strokeWidth="1.1" />
        <path
          d="M12 8.4l1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4 1.2-2.4Z"
          fill="#f1cba2"
        />
      </svg>
    </TierBadge>
  )
}

export function SilverTierIcon({ className }: { className?: string }) {
  return (
    <TierBadge
      className={className}
      ringFrom="#d9dde6"
      ringTo="#6d7380"
      glow="rgba(217, 221, 230, 0.4)"
      accent="rgba(109, 115, 128, 0.6)"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 5.6l6 2.6v4.5c0 3.2-2.1 5.8-6 6.9-3.9-1.1-6-3.7-6-6.9V8.2l6-2.6Z"
          fill="#252830"
          stroke="#d9dde6"
          strokeWidth="1.1"
        />
        <path
          d="M9 10.6l3 2 3-2"
          stroke="#eef2f7"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 13.2l3 2 3-2"
          stroke="#cfd6e2"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </TierBadge>
  )
}

export function GoldTierIcon({ className }: { className?: string }) {
  return (
    <TierBadge
      className={className}
      ringFrom="#f0c766"
      ringTo="#8a6514"
      glow="rgba(255, 227, 160, 0.45)"
      accent="rgba(138, 101, 20, 0.65)"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7.2 15l1.6-6 3.2 3.2 3.2-3.2 1.6 6H7.2Z"
          fill="#ffe3a0"
          stroke="#f0c766"
          strokeWidth="1"
        />
        <path d="M6.8 15.4h10.4l-1.1 2.2H7.9l-1.1-2.2Z" fill="#f5d07c" />
        <circle cx="8.8" cy="8.8" r="1" fill="#ffeac0" />
        <circle cx="15.2" cy="8.8" r="1" fill="#ffeac0" />
      </svg>
    </TierBadge>
  )
}

export function DiamondTierIcon({ className }: { className?: string }) {
  return (
    <TierBadge
      className={className}
      ringFrom="#7de3f6"
      ringTo="#3b6ff2"
      glow="rgba(153, 233, 255, 0.5)"
      accent="rgba(59, 111, 242, 0.6)"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5.8l4.8 5.4-4.8 6.9-4.8-6.9L12 5.8Z" fill="#e1f8ff" />
        <path d="M12 7.8l3.2 3.5-3.2 4.9-3.2-4.9L12 7.8Z" fill="#99e9ff" />
        <path d="M7.2 11.2h9.6" stroke="#c6f4ff" strokeWidth="1" opacity="0.7" />
      </svg>
    </TierBadge>
  )
}

export function TierIcon({ tier, className }: { tier: string; className?: string }) {
  switch (tier) {
    case "bronze":
      return <BronzeTierIcon className={className} />
    case "silver":
      return <SilverTierIcon className={className} />
    case "gold":
      return <GoldTierIcon className={className} />
    case "diamond":
      return <DiamondTierIcon className={className} />
    default:
      return <BronzeTierIcon className={className} />
  }
}
