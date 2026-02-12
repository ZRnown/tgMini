import { useEffect, useState } from "react"

export type PublicConfig = {
  publicGroupAnnounceUrl: string
  publicGroupGuideUrl: string
  publicGroupFeedbackUrl: string
  communityBotUrl: string
  supportBotUrl: string
}

const defaultConfig: PublicConfig = {
  publicGroupAnnounceUrl: "",
  publicGroupGuideUrl: "",
  publicGroupFeedbackUrl: "",
  communityBotUrl: "",
  supportBotUrl: "",
}

export const usePublicConfig = () => {
  const [config, setConfig] = useState<PublicConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch("/api/public-config", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as Partial<PublicConfig>
        if (!mounted) return
        setConfig({
          ...defaultConfig,
          ...data,
        })
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return { config, isLoading }
}
