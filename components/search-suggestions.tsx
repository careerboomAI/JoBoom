"use client"

import { Icon } from "@iconify/react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export type Source = "auto" | "linkedin" | "upwork" | "behance" | "indeed" | "freelance"

export interface Suggestion {
  sources: Source[]
  query: string
}

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string, sources: Source[]) => void
}

const suggestionsRow1: Suggestion[] = [
  { sources: ["auto"], query: "Senior Software Engineer remote positions" },
  { sources: ["linkedin", "indeed"], query: "Product Manager jobs in San Francisco" },
  { sources: ["auto"], query: "UI/UX Designer in London" },
  { sources: ["upwork", "freelance"], query: "Full-stack developer positions in Dubai" },
  { sources: ["auto"], query: "Data Scientist machine learning roles in Berlin" },
  { sources: ["freelance"], query: "Mobile app developer hourly gigs" },
  { sources: ["linkedin"], query: "Engineering Manager tech companies in Singapore" },
  { sources: ["upwork"], query: "WordPress developer quick projects" },
  { sources: ["indeed"], query: "Frontend developer React jobs in New York" },
]

const suggestionsRow2: Suggestion[] = [
  { sources: ["upwork", "freelance"], query: "React Native developer long-term project" },
  { sources: ["linkedin", "indeed"], query: "Marketing Manager hybrid roles in Toronto" },
  { sources: ["auto"], query: "DevOps Engineer cloud positions" },
  { sources: ["behance"], query: "Brand identity designer in Amsterdam" },
  { sources: ["indeed"], query: "Customer Success Manager SaaS in Austin" },
  { sources: ["linkedin"], query: "VP of Sales startup opportunities in Paris" },
  { sources: ["auto"], query: "Backend developer Python Django remote" },
  { sources: ["behance", "upwork"], query: "Motion graphics designer video projects in Tokyo" },
  { sources: ["freelance"], query: "iOS developer Swift jobs in Sydney" },
]

const SourceIcon = ({ source, className }: { source: Source; className?: string }) => {
  switch (source) {
    case "auto":
      return <Sparkles className={className} />
    case "linkedin":
      return <Icon icon="mdi:linkedin" className={className} />
    case "upwork":
      return <Icon icon="simple-icons:upwork" className={className} />
    case "behance":
      return <Icon icon="mdi:behance" className={className} />
    case "indeed":
      return <Icon icon="simple-icons:indeed" className={className} />
    case "freelance":
      return <Icon icon="simple-icons:freelancer" className={className} />
    default:
      return null
  }
}

interface MarqueeRowProps {
  suggestions: Suggestion[]
  onSuggestionClick: (suggestion: string, sources: Source[]) => void
  direction?: "left" | "right"
  speed?: number
}

function MarqueeRow({ suggestions, onSuggestionClick, direction = "left", speed = 30 }: MarqueeRowProps) {
  const [isPaused, setIsPaused] = useState(false)

  // Duplicate suggestions for seamless loop
  const duplicatedSuggestions = [...suggestions, ...suggestions]

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Fade overlays */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

      {/* Scrolling content */}
      <div
        className="flex gap-3 py-1"
        style={{
          animation: `marquee-${direction} ${speed}s linear infinite`,
          animationPlayState: isPaused ? "paused" : "running",
          width: "max-content",
        }}
      >
        {duplicatedSuggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="gap-2 rounded-full text-sm font-normal h-auto py-2 px-4 hover:bg-muted/80 transition-colors shrink-0 cursor-pointer"
            onClick={() => onSuggestionClick(suggestion.query, suggestion.sources)}
          >
            <div className="flex items-center gap-1 shrink-0">
              {suggestion.sources.map((source, idx) => (
                <SourceIcon 
                  key={idx} 
                  source={source} 
                  className="h-3.5 w-3.5 opacity-70" 
                />
              ))}
            </div>
            <span className="text-muted-foreground whitespace-nowrap">{suggestion.query}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function SearchSuggestions({ onSuggestionClick }: SearchSuggestionsProps) {
  return (
    <div className="mt-6 max-w-4xl mx-auto space-y-3 overflow-hidden">
      <MarqueeRow 
        suggestions={suggestionsRow1} 
        onSuggestionClick={onSuggestionClick} 
        direction="left"
        speed={35}
      />
      <MarqueeRow 
        suggestions={suggestionsRow2} 
        onSuggestionClick={onSuggestionClick} 
        direction="right"
        speed={40}
      />
    </div>
  )
}
