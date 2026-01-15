interface ResultsHeaderProps {
  count: number
  total?: number
}

export function ResultsHeader({ count, total }: ResultsHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-muted-foreground text-sm">
        Showing {count} {total ? `of ${total}` : ""} matching {total === 1 ? "job" : "jobs"}
      </p>
    </div>
  )
}
