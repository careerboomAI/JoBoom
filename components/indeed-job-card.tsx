"use client"

import React from "react"
import { Icon } from "@iconify/react"
import { 
  MapPin, 
  Building2, 
  Clock, 
  ExternalLink, 
  Briefcase,
  DollarSign,
  Users,
  Globe,
  Star,
  MessageSquare
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
import type { IndeedJobCardData } from "@/types/indeed_job_search"

interface IndeedJobCardProps {
  job: IndeedJobCardData
}

/**
 * Format salary display
 */
function formatSalary(job: IndeedJobCardData): string | null {
  if (!job.salaryMin && !job.salaryMax) return null
  
  const currency = job.salaryCurrency || "USD"
  const period = job.salaryPeriod || "yearly"
  
  const formatNum = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
    return n.toFixed(0)
  }
  
  let salaryStr = ""
  if (job.salaryMin && job.salaryMax) {
    salaryStr = `${currency} ${formatNum(job.salaryMin)} - ${formatNum(job.salaryMax)}`
  } else if (job.salaryMin) {
    salaryStr = `${currency} ${formatNum(job.salaryMin)}+`
  } else if (job.salaryMax) {
    salaryStr = `Up to ${currency} ${formatNum(job.salaryMax)}`
  }
  
  const periodMap: Record<string, string> = {
    yearly: "/yr",
    monthly: "/mo",
    weekly: "/wk",
    hourly: "/hr",
  }
  
  return salaryStr + (periodMap[period] || `/${period}`)
}

/**
 * Format time ago from date string
 */
function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return ""
  
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * Format job type
 */
function formatJobType(jobType: string | null): string {
  if (!jobType) return ""
  
  const mapping: Record<string, string> = {
    "fulltime": "Full-time",
    "full-time": "Full-time",
    "parttime": "Part-time",
    "part-time": "Part-time",
    "contract": "Contract",
    "temporary": "Temporary",
    "internship": "Internship",
  }
  
  return mapping[jobType.toLowerCase()] || jobType
}

export function IndeedJobCard({ job }: IndeedJobCardProps) {
  const salary = formatSalary(job)
  const timeAgo = formatTimeAgo(job.postedDate)
  
  const handleApply = () => {
    window.open(job.url, "_blank", "noopener,noreferrer")
  }

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <CardContent className="p-4 sm:p-5">
        {/* Header: Logo + Title + Source */}
        <div className="flex gap-3 sm:gap-4">
          {/* Company Logo */}
          <div className="relative flex-shrink-0">
            {job.company.logo ? (
              <img
                src={job.company.logo}
                alt={job.company.name}
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
            
            {/* Source badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -bottom-1 -right-1 rounded-full p-1.5 bg-[#003A9B]/90 shadow-lg border-2 border-card cursor-default hover:scale-110 transition-transform">
                  <Icon 
                    icon="simple-icons:indeed" 
                    className="h-3 w-3 text-white" 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Found on Indeed
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
              
              {job.company.rating && (
                <span className="flex items-center gap-0.5 text-amber-500 text-sm">
                  <Star className="h-3 w-3 fill-current" />
                  {job.company.rating.toFixed(1)}
                </span>
              )}
              
              {job.company.industry && (
                <span className="text-xs text-muted-foreground/60 hidden sm:inline">
                  • {job.company.industry}
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

          {/* Remote */}
          {job.isRemote && (
            <div className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              <span>Remote</span>
            </div>
          )}

          {/* Job Type */}
          {job.jobType && (
            <div className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              <span>{formatJobType(job.jobType)}</span>
            </div>
          )}

          {/* Date Posted */}
          {timeAgo && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeAgo}</span>
            </div>
          )}
        </div>

        {/* Salary */}
        {salary && (
          <div className="flex items-center gap-1.5 mt-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">{salary}</span>
          </div>
        )}

        {/* Description preview */}
        {job.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.skills.slice(0, 5).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 5 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{job.skills.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Additional badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {job.jobLevel && (
            <Badge variant="outline" className="text-xs capitalize">
              {job.jobLevel}
            </Badge>
          )}

          {job.experienceRange && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1">
                    <Users className="h-3 w-3" />
                    {job.experienceRange}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Experience required</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {job.vacancyCount && job.vacancyCount > 1 && (
            <Badge variant="outline" className="text-xs gap-1 border-blue-500/50 text-blue-600">
              <Users className="h-3 w-3" />
              {job.vacancyCount} openings
            </Badge>
          )}

          {job.listingType && job.listingType !== "standard" && (
            <Badge variant="outline" className="text-xs capitalize border-amber-500/50 text-amber-600">
              <Star className="h-3 w-3" />
              {job.listingType}
            </Badge>
          )}
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {job.company.employeeCount && (
              <span>{job.company.employeeCount}</span>
            )}
            {job.company.reviewCount && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {job.company.reviewCount.toLocaleString()} reviews
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {job.officialUrl && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(job.officialUrl!, "_blank")}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Apply on company site</TooltipContent>
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
