import { createHash } from "crypto"

export function hashInviteCode(rawInviteCode: string) {
  return createHash("sha256")
    .update(rawInviteCode.trim().toLowerCase())
    .digest("hex")
}
