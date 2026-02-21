export const getTmaInitData = () => {
  if (typeof window === "undefined") return ""
  const tg = (window as any).Telegram?.WebApp
  if (tg?.initData && typeof tg.initData === "string") {
    return tg.initData
  }
  return ""
}

export const withTmaHeaders = (headers: HeadersInit = {}) => {
  const initData = getTmaInitData()
  if (!initData) return headers
  return {
    ...headers,
    "x-tma-init-data": initData,
  }
}

