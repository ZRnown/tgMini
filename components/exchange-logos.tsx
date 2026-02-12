import Image from "next/image"
import { cn } from "@/lib/utils"

const exchangeLogos: Record<string, { src: string; alt: string }> = {
  binance: { src: "/logos/binance.svg", alt: "Binance" },
  okx: { src: "/logos/okx.svg", alt: "OKX" },
  weex: { src: "/logos/weex.png", alt: "Weex" },
  bitget: { src: "/logos/bitget-icon.svg", alt: "Bitget" },
  "gate.io": { src: "/logos/gate.png", alt: "Gate.io" },
  gate: { src: "/logos/gate.png", alt: "Gate.io" },
}

export function ExchangeLogo({
  exchange,
  className = "w-6 h-6",
}: {
  exchange: string
  className?: string
}) {
  const key = exchange.toLowerCase()
  const logo = exchangeLogos[key]

  if (!logo) {
    return (
      <div className={cn("rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-foreground", className)}>
        {exchange.charAt(0)}
      </div>
    )
  }

  return (
    <Image
      src={logo.src || "/placeholder.svg"}
      alt={logo.alt}
      width={48}
      height={48}
      className={cn("rounded-lg object-contain", className)}
    />
  )
}
