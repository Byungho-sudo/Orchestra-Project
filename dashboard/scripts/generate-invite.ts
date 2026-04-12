import { hashInviteCode } from "../lib/guest/invite-code-hash"

const rawCode = process.argv[2]?.trim()

if (!rawCode) {
  console.error('Usage: npx tsx scripts/generate-invite.ts "ORCH-ALPHA-001"')
  process.exit(1)
}

const codeHash = hashInviteCode(rawCode)

console.log(`Raw code: ${rawCode}`)
console.log(`Hash: ${codeHash}`)
