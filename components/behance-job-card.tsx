"use client"

import React from "react"
import { Icon } from "@iconify/react"
import { 
  MapPin, 
  Building2, 
  ExternalLink, 
  Briefcase,
  User
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { BehanceJobCardData } from "@/types/behance_job_search"

interface BehanceJobCardProps {
  job: BehanceJobCardData
}

/**
 * Get job type badge styling
 */
function getJobTypeBadge(jobType: string): { color: string } {
  const typeMap: Record<string, { color: string }> = {
    "Full-time": { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    "Freelance": { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
    "Part-time": { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    "Contract": { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
    "Internship": { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  }
  return typeMap[jobType] || { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" }
}

export function BehanceJobCard({ job }: BehanceJobCardProps) {
  const jobTypeBadge = getJobTypeBadge(job.jobType)
  
  const handleApply = () => {
    window.open(job.url, "_blank", "noopener,noreferrer")
  }

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <CardContent className="p-4 sm:p-5">
        {/* Header: Creator Image + Title + Source */}
        <div className="flex gap-3 sm:gap-4">
          {/* Creator/Company Image */}
          <div className="relative flex-shrink-0">
            {job.creator.image ? (
              <img
                src={job.creator.image}
                alt={job.creator.name || job.company.name}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
            ) : (
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            
            {/* Source badge - Behance blue */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -bottom-1 -right-1 rounded-full p-1.5 bg-[#1769ff]/90 shadow-lg border-2 border-card cursor-default hover:scale-110 transition-transform">
                  <Icon 
                    icon="mdi:behance" 
                    className="h-3 w-3 text-white" 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Found on Behance
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Title & Company */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            
            <div className="flex items-center gap-1.5 mt-1">
              {job.company.url ? (
                <a
                  href={job.company.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors truncate"
                >
                  {job.company.name}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground truncate">
                  {job.company.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-sm text-muted-foreground">
          {/* Location */}
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[150px]">{job.location}</span>
          </div>

          {/* Job Type */}
          {job.jobType && (
            <div className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              <span>{job.jobType}</span>
            </div>
          )}
        </div>

        {/* Description preview */}
        {job.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {job.jobType && (
            <Badge className={cn("text-xs", jobTypeBadge.color)}>
              {job.jobType}
            </Badge>
          )}
          
          {job.jobStatus === "ACTIVE" && (
            <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">
              Active
            </Badge>
          )}
        </div>

        {/* Creator info */}
        {job.creator.name && job.creator.name !== job.company.name && (
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Posted by </span>
            {job.creator.url ? (
              <a
                href={job.creator.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline transition-colors"
              >
                {job.creator.name}
              </a>
            ) : (
              <span>{job.creator.name}</span>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            Behance Jobs
          </div>

          <div className="flex items-center gap-2">
            {job.company.url && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(job.company.url, "_blank")}
                    >
                      <Building2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Company website</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Button size="sm" onClick={handleApply} className="gap-1.5">
              Apply
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

