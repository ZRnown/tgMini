import { NextResponse } from "next/server"

export const jsonOk = (data: unknown, init?: ResponseInit) => {
  return NextResponse.json({ ok: true, data }, init)
}

export const jsonError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : String(error)
  return NextResponse.json({ ok: false, error: message }, { status })
}
