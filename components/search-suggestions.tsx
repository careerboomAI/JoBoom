"use client"

import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
}

type Platform = "linkedin" | "upwork" | "behance" | "glassdoor" | "indeed" | "freelance"

interface Suggestion {
  platform: Platform
  query: string
}

const suggestions: Suggestion[] = [
  { platform: "linkedin", query: "Senior Software Engineer remote positions" },
  { platform: "indeed", query: "Product Manager jobs in San Francisco" },
  { platform: "behance", query: "UX/UI Designer freelance projects" },
  { platform: "upwork", query: "Full-stack developer contract work" },
  { platform: "glassdoor", query: "Data Scientist positions with good reviews" },
]

const PlatformIcon = ({ platform, className }: { platform: Platform; className?: string }) => {
  switch (platform) {
    case "linkedin":
      return <Icon icon="mdi:linkedin" className={className} />
    case "upwork":
      return <Icon icon="simple-icons:upwork" className={className} />
    case "behance":
      return <Icon icon="mdi:behance" className={className} />
    case "glassdoor":
      return <Icon icon="cib:glassdoor" className={className} />
    case "indeed":
      return <Icon icon="simple-icons:indeed" className={className} />
    case "freelance":
      return <Icon icon="simple-icons:freelancer" className={className} />
    default:
      return null
  }
}

export function SearchSuggestions({ onSuggestionClick }: SearchSuggestionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-3xl mx-auto">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="gap-2 rounded-full text-sm font-normal h-auto py-2 px-4 hover:bg-muted/80 transition-colors"
          onClick={() => onSuggestionClick(suggestion.query)}
        >
          <PlatformIcon platform={suggestion.platform} className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="text-muted-foreground">{suggestion.query}</span>
        </Button>
      ))}
    </div>
  )
}
