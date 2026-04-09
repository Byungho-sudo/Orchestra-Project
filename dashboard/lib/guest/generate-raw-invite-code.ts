import { randomBytes } from "crypto"

function generateSegment(length: number) {
  return randomBytes(length)
    .toString("hex")
    .slice(0, length)
    .toUpperCase()
}

export function generateRawInviteCode() {
  return `ORCH-${generateSegment(4)}-${generateSegment(6)}`
}
