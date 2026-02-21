import { NextRequest, NextResponse } from "next/server"
import { requireTelegramUser } from "@/server/auth/telegram"
import { prisma } from "@/server/prisma"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireTelegramUser(request)
    const page = Math.max(Number(request.nextUrl.searchParams.get("page") ?? "1"), 1)
    const pageSize = Math.min(Math.max(Number(request.nextUrl.searchParams.get("pageSize") ?? "10"), 1), 50)

    const where = { userId: user.id }
    const total = await prisma.withdrawalRequest.count({ where })
    const items = await prisma.withdrawalRequest.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const totalPages = Math.max(Math.ceil(total / pageSize), 1)
    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total,
      totalPages,
      items: items.map((item) => ({
        id: item.id,
        amount: Number(item.amount),
        fee: Number(item.fee),
        status: item.status,
        requestedAt: item.requestedAt.toISOString(),
        txHash: item.txHash ?? "",
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

