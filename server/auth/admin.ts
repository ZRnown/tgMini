import { env } from "../env"

export const assertAdminId = (adminId: bigint | null) => {
  if (!adminId) throw new Error("Missing admin id")
  const allowed = env.adminIds.map((id) => BigInt(id))
  if (!allowed.includes(adminId)) {
    throw new Error("Forbidden: admin only")
  }
}
