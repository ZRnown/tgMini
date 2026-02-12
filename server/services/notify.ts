import { env } from "../env"

export const sendTelegramMessage = async (userId: bigint, text: string) => {
  if (!env.botToken) return
  const url = `https://api.telegram.org/bot${env.botToken}/sendMessage`
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: userId.toString(), text }),
  })
}
