import { useEffect, useState } from "react"

export type VipConfigItem = {
  level: number
  name: string
  minPoints: number
  rebateRatioBonus: number
}

type VipConfigState = {
  configs: VipConfigItem[]
  loading: boolean
  error: string | null
}

export function useVipConfig(): VipConfigState {
  const [configs, setConfigs] = useState<VipConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/vip-config", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as VipConfigItem[]
        if (active) {
          setConfigs(Array.isArray(data) ? data : [])
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "加载失败")
          setConfigs([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return { configs, loading, error }
}
