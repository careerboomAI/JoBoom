import { Search } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-secondary p-4 mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
      <p className="text-muted-foreground max-w-sm">
        We couldn&apos;t find any job postings matching your search. Try adjusting your search terms or upload your CV for better matches.
      </p>
    </div>
  )
}
