import { Card } from "@/components/ui/Card"

export function DashboardStatCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold text-[var(--color-text-primary)]">
        {value}
      </p>
    </Card>
  )
}
