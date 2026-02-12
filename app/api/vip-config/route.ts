import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"

export async function GET() {
  const list = await prisma.vipConfig.findMany({ orderBy: { level: "asc" } })
  const payload = list.map((item) => ({
    level: item.level,
    name: item.name,
    minPoints: item.minPoints,
    rebateRatioBonus: Number(item.rebateRatioBonus),
  }))
  return NextResponse.json(payload)
}
