import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"

const keys = [
  "PUBLIC_GROUP_ANNOUNCE_URL",
  "PUBLIC_GROUP_GUIDE_URL",
  "PUBLIC_GROUP_FEEDBACK_URL",
  "COMMUNITY_BOT_URL",
  "SUPPORT_BOT_URL",
]

export async function GET() {
  const list = await prisma.config.findMany({
    where: { key: { in: keys } },
  })
  const map = list.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.value
    return acc
  }, {})

  return NextResponse.json({
    publicGroupAnnounceUrl: map.PUBLIC_GROUP_ANNOUNCE_URL ?? "",
    publicGroupGuideUrl: map.PUBLIC_GROUP_GUIDE_URL ?? "",
    publicGroupFeedbackUrl: map.PUBLIC_GROUP_FEEDBACK_URL ?? "",
    communityBotUrl: map.COMMUNITY_BOT_URL ?? "",
    supportBotUrl: map.SUPPORT_BOT_URL ?? "",
  })
}
