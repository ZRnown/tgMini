import { prisma } from "../prisma"

export const assertUserNonce = async (userId: bigint, nonce: string | null) => {
  if (!nonce) {
    throw new Error("Missing nonce")
  }
  const existing = await prisma.replayNonce.findUnique({ where: { nonce } })
  if (existing) {
    throw new Error("Replay detected")
  }
  await prisma.replayNonce.create({
    data: {
      nonce,
      userId,
    },
  })
}
