"use client"

import React from "react"
import { Icon } from "@iconify/react"
import { FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  IconAdjustmentsHorizontal,
  IconArrowUp,
  IconLoader2,
} from "@tabler/icons-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  isLoading: boolean
  filters: {
    auto: boolean
    linkedin: boolean
    upwork: boolean
    behance: boolean
    glassdoor: boolean
    indeed: boolean
    freelance: boolean
  }
  onFilterChange: (filter: "auto" | "linkedin" | "upwork" | "behance" | "glassdoor" | "indeed" | "freelance", checked: boolean) => void
  onCVUpload?: (file: File) => void
  onLinkedinUrlSubmit?: (url: string) => void
  cvFile?: File | null
  isParsingCV?: boolean
  linkedinUrl?: string
  isFetchingLinkedIn?: boolean
}

const PLATFORM_FILTERS = [
  { 
    id: "linkedin" as const, 
    label: "LinkedIn",
    icon: (props: { className?: string }) => <Icon icon="mdi:linkedin" className={cn("text-[#0077b5]", props.className)} />,
    comingSoon: false,
  },
  { 
    id: "behance" as const, 
    label: "Behance",
    icon: (props: { className?: string }) => <Icon icon="mdi:behance" className={cn("text-[#1769ff]", props.className)} />,
    comingSoon: false,
  },
  { 
    id: "indeed" as const, 
    label: "Indeed",
    icon: (props: { className?: string }) => <Icon icon="simple-icons:indeed" className={cn("text-[#003A9B]", props.className)} />,
    comingSoon: false,
  },
  { 
    id: "freelance" as const, 
    label: "Freelance.com",
    icon: (props: { className?: string }) => <Icon icon="simple-icons:freelancer" className={cn("text-[#29B2FE]", props.className)} />,
    comingSoon: false,
  },
  { 
    id: "upwork" as const, 
    label: "Upwork",
    icon: (props: { className?: string }) => <Icon icon="simple-icons:upwork" className={cn("text-[#14A800]", props.className)} />,
    comingSoon: false,
  },
  { 
    id: "glassdoor" as const, 
    label: "Glassdoor",
    icon: (props: { className?: string }) => <Icon icon="cib:glassdoor" className={cn("text-[#0CAA41]", props.className)} />,
    comingSoon: true,
  },
]

export function SearchBar({ 
  value, 
  onChange, 
  onSearch, 
  isLoading, 
  filters, 
  onFilterChange,
  onCVUpload,
  onLinkedinUrlSubmit,
  cvFile,
  isParsingCV,
  linkedinUrl,
  isFetchingLinkedIn 
}: SearchBarProps) {
  const [showLinkedinInput, setShowLinkedinInput] = React.useState(false)
  const [tempLinkedinUrl, setTempLinkedinUrl] = React.useState(linkedinUrl || "")
  const [linkedinError, setLinkedinError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  /**
   * Validates and normalizes a LinkedIn URL
   * Accepts various formats and returns normalized: https://www.linkedin.com/in/username/
   */
  const validateAndNormalizeLinkedinUrl = (url: string): { valid: boolean; normalized?: string; error?: string } => {
    if (!url.trim()) {
      return { valid: false, error: "Please enter a LinkedIn URL" }
    }

    // Regex to match linkedin.com/in/username in various formats
    // Handles: linkedin.com/in/user, www.linkedin.com/in/user, https://linkedin.com/in/user, etc.
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)\/?/i
    const match = url.match(linkedinRegex)

    if (!match || !match[1]) {
      return { 
        valid: false, 
        error: "Invalid LinkedIn URL. Please use format: linkedin.com/in/username" 
      }
    }

    const username = match[1]
    const normalized = `https://www.linkedin.com/in/${username}/`
    
    return { valid: true, normalized }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSearch()
    }
  }

  const handleCVClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onCVUpload) {
      onCVUpload(file)
    }
  }

  const handleLinkedinSubmit = () => {
    if (!tempLinkedinUrl || !onLinkedinUrlSubmit) return

    const result = validateAndNormalizeLinkedinUrl(tempLinkedinUrl)
    
    if (!result.valid) {
      setLinkedinError(result.error || "Invalid LinkedIn URL")
      return
    }

    setLinkedinError(null)
    onLinkedinUrlSubmit(result.normalized!)
    setShowLinkedinInput(false)
  }

  const handleLinkedinInputChange = (value: string) => {
    setTempLinkedinUrl(value)
    // Clear error when user starts typing
    if (linkedinError) {
      setLinkedinError(null)
    }
  }

  // Filter out "coming soon" platforms from active display
  const activePlatforms = PLATFORM_FILTERS.filter(p => filters[p.id] && !p.comingSoon)

  return (
    <div className="relative z-10 flex flex-col w-full mx-auto max-w-2xl content-center">
      <form
        className="overflow-visible rounded-xl border border-border bg-card p-2 transition-colors duration-200 focus-within:border-ring shadow-sm"
        onSubmit={handleSubmit}
      >
        <Textarea
          className="max-h-32 min-h-12 resize-none rounded-none border-none bg-transparent! p-2 text-base shadow-none focus-visible:border-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your ideal job (e.g., remote software engineer position)"
          value={value}
        />

        <div className="flex items-center gap-1 pt-1">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              className="h-8 gap-1.5 rounded-lg px-2.5"
              size="sm"
              type="button"
              variant={cvFile ? "default" : "ghost"}
              onClick={handleCVClick}
              disabled={isParsingCV}
            >
              {isParsingCV ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              <span className="text-xs font-medium hidden sm:inline">
                {isParsingCV ? "Parsing..." : cvFile ? cvFile.name.substring(0, 12) + "..." : "My CV"}
              </span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />

            <DropdownMenu open={showLinkedinInput} onOpenChange={setShowLinkedinInput}>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-8 gap-1.5 rounded-lg px-2.5"
                  size="sm"
                  type="button"
                  variant={linkedinUrl ? "default" : "ghost"}
                  disabled={isFetchingLinkedIn}
                >
                  {isFetchingLinkedIn ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <Icon icon="eva:linkedin-outline" width={16} height={16} />
                  )}
                  <span className="text-xs font-medium hidden sm:inline">
                    {isFetchingLinkedIn ? "Loading..." : "My LinkedIn"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-80 rounded-xl p-4"
              >
                <div className="space-y-3">
                  <Label className="text-sm font-medium">LinkedIn Profile URL</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="linkedin.com/in/yourprofile"
                      value={tempLinkedinUrl}
                      onChange={(e) => handleLinkedinInputChange(e.target.value)}
                      className={cn("flex-1", linkedinError && "border-destructive focus-visible:ring-destructive")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleLinkedinSubmit()
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleLinkedinSubmit}
                      disabled={!tempLinkedinUrl}
                    >
                      Add
                    </Button>
                  </div>
                  {linkedinError && (
                    <p className="text-xs text-destructive">
                      {linkedinError}
                    </p>
                  )}
                  {linkedinUrl && !linkedinError && (
                    <p className="text-xs text-muted-foreground">
                      ✓ {linkedinUrl}
                    </p>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-8 gap-1.5 rounded-lg px-2.5"
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <IconAdjustmentsHorizontal size={16} />
                  <span className="text-xs font-medium">Sources</span>
                  <div className="ml-1 flex items-center gap-1">
                    {filters.auto ? (
                      <div className="flex items-center justify-center rounded-full bg-primary/10 p-1 text-primary">
                        <Sparkles size={12} />
                      </div>
                    ) : (
                      <div className="flex -space-x-1.5">
                        {activePlatforms.map((platform, i) => (
                          <div 
                            key={platform.id} 
                            className="relative flex h-5 w-5 items-center justify-center rounded-full border border-background bg-card shadow-sm"
                            style={{ zIndex: activePlatforms.length - i }}
                          >
                            <platform.icon className="h-3 w-3" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 rounded-xl p-3"
              >
                <DropdownMenuGroup className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium cursor-pointer">Auto</Label>
                    </div>
                    <Switch
                      checked={filters.auto}
                      className="scale-90"
                      onCheckedChange={(checked) => onFilterChange("auto", checked)}
                    />
                  </div>
                  {PLATFORM_FILTERS.map((platform) => (
                    <div 
                      key={platform.id} 
                      className={cn(
                        "flex items-center justify-between",
                        (filters.auto || platform.comingSoon) && "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <platform.icon className={cn("h-4 w-4", platform.comingSoon && "grayscale")} />
                        <Label className="text-sm font-normal cursor-pointer">{platform.label}</Label>
                        {platform.comingSoon && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            Soon
                          </span>
                        )}
                      </div>
                      <Switch
                        checked={platform.comingSoon ? false : (filters.auto ? true : filters[platform.id])}
                        disabled={filters.auto || platform.comingSoon}
                        className="scale-90"
                        onCheckedChange={(checked) => onFilterChange(platform.id, checked)}
                      />
                    </div>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              className="h-8 w-8 rounded-lg"
              disabled={!value.trim() || isLoading}
              size="icon"
              type="submit"
              variant="default"
            >
              {isLoading ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                <IconArrowUp size={16} />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
