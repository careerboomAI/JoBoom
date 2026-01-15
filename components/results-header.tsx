"use client"

import { Icon } from "@iconify/react"
import { User, FileText, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { UserProfile } from "@/types/user-profile"

interface ResultsHeaderProps {
  count: number
  total?: number
  userProfile?: UserProfile | null
  showProfilePanel?: boolean
  onToggleProfilePanel?: () => void
}

export function ResultsHeader({ 
  count, 
  total, 
  userProfile,
  showProfilePanel,
  onToggleProfilePanel,
}: ResultsHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Left: Results count */}
      <p className="text-muted-foreground text-sm">
        Showing {count} {total ? `of ${total}` : ""} matching {total === 1 ? "job" : "jobs"}
      </p>

      {/* Right: Profile toggle button (only if profile exists and panel is hidden) */}
      {userProfile && !showProfilePanel && onToggleProfilePanel && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleProfilePanel}
              className="gap-2 self-start sm:self-auto"
            >
              {/* Profile avatar or icon */}
              {userProfile.personalInfo.profilePictureUrl ? (
                <img
                  src={userProfile.personalInfo.profilePictureUrl}
                  alt={userProfile.personalInfo.fullName}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
              
              <span className="hidden sm:inline">
                {userProfile.personalInfo.firstName || "Profile"}
              </span>
              
              {/* Source badges */}
              <div className="flex items-center gap-0.5">
                {userProfile.sources.linkedin && (
                  <Icon icon="mdi:linkedin" className="h-3.5 w-3.5 text-[#0077b5]" />
                )}
                {userProfile.sources.cv && (
                  <FileText className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Show profile panel</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
