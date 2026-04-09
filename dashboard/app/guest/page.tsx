import { Suspense } from "react"
import { GuestAccessClient } from "./GuestAccessClient"

export default function GuestAccessPage() {
  return (
    <Suspense>
      <GuestAccessClient />
    </Suspense>
  )
}
