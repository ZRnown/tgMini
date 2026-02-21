import { NextRequest, NextResponse } from "next/server"
import { requireTelegramUser } from "@/server/auth/telegram"
import { requestBinding } from "@/server/services/binding"

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireTelegramUser(request)
    const body = (await request.json()) as { exchange?: string; uid?: string }
    const exchange = body.exchange?.trim() ?? ""
    const uid = body.uid?.trim() ?? ""

    if (!exchange || !uid) {
      return NextResponse.json({ ok: false, error: "exchange 与 uid 必填" }, { status: 400 })
    }

    const binding = await requestBinding(user.id, exchange, uid)
    return NextResponse.json({ ok: true, binding })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

