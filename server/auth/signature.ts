import crypto from "crypto"
import { NextRequest } from "next/server"
import { env } from "../env"
import { prisma } from "../prisma"

const computeSignature = (payload: string) => {
  return crypto
    .createHmac("sha256", env.apiSigningSecret)
    .update(payload)
    .digest("hex")
}

const timingSafeEqual = (a: string, b: string) => {
  const aBuf = Buffer.from(a, "hex")
  const bBuf = Buffer.from(b, "hex")
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

const buildPayload = (request: NextRequest, rawBody: string, timestamp: string, nonce: string) => {
  return [timestamp, nonce, request.method.toUpperCase(), request.nextUrl.pathname, rawBody].join(".")
}

export const verifySignedRequest = async (request: NextRequest, rawBody: string) => {
  const signature = request.headers.get("x-signature") || ""
  const timestamp = request.headers.get("x-timestamp") || ""
  const nonce = request.headers.get("x-nonce") || ""
  const adminId = request.headers.get("x-admin-id") || ""

  if (!signature || !timestamp || !nonce) {
    throw new Error("Missing signature headers")
  }

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) {
    throw new Error("Invalid signature timestamp")
  }
  const ageSec = Math.abs(Date.now() / 1000 - ts)
  if (ageSec > env.signatureMaxAgeSec) {
    throw new Error("Signature expired")
  }

  const payload = buildPayload(request, rawBody, timestamp, nonce)
  const expected = computeSignature(payload)
  if (!timingSafeEqual(expected, signature)) {
    throw new Error("Invalid signature")
  }

  const existing = await prisma.replayNonce.findUnique({ where: { nonce } })
  if (existing) {
    throw new Error("Replay detected")
  }

  await prisma.replayNonce.create({
    data: {
      nonce,
      userId: adminId ? BigInt(adminId) : null,
    },
  })

  return { adminId: adminId ? BigInt(adminId) : null }
}

export const requireSignedJson = async <T>(request: NextRequest) => {
  const rawBody = await request.text()
  const { adminId } = await verifySignedRequest(request, rawBody)
  const body = rawBody ? (JSON.parse(rawBody) as T) : ({} as T)
  return { body, adminId, rawBody }
}
