"use client"

import { Icon } from "@iconify/react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { UpworkJobCardData } from "@/types/upwork_job_search"

interface UpworkJobCardProps {
  job: UpworkJobCardData
}

export function UpworkJobCard({ job }: UpworkJobCardProps) {
  const formatBudget = () => {
    if (job.budgetType === "FIXED" && job.budgetAmount) {
      return `$${job.budgetAmount.toLocaleString()} Fixed`
    }
    if (job.budgetType === "HOURLY") {
      if (job.hourlyRateMin && job.hourlyRateMax) {
        return `$${job.hourlyRateMin} - $${job.hourlyRateMax}/hr`
      }
      if (job.hourlyRateMax) {
        return `Up to $${job.hourlyRateMax}/hr`
      }
      if (job.hourlyRateMin) {
        return `From $${job.hourlyRateMin}/hr`
      }
      return "Hourly"
    }
    return "Budget not specified"
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case "ENTRY_LEVEL": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "INTERMEDIATE": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "EXPERT": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getCompetitionLevel = (applicants: number) => {
    if (applicants < 5) return { text: "Low", color: "text-green-600" }
    if (applicants < 15) return { text: "Medium", color: "text-yellow-600" }
    if (applicants < 30) return { text: "High", color: "text-orange-600" }
    return { text: "Very High", color: "text-red-600" }
  }

  const competition = getCompetitionLevel(job.totalApplicants)

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : "N/A"
  }

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount.toFixed(0)}`
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="simple-icons:upwork" className="h-4 w-4 text-[#14A800] flex-shrink-0" />
              <span className="text-xs text-muted-foreground">{job.category}</span>
            </div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
          </div>
          <Badge variant="secondary" className="flex-shrink-0 font-semibold text-sm">
            {formatBudget()}
          </Badge>
        </div>

        {/* Experience & Duration */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className={getExperienceBadgeColor(job.experienceLevel)}>
            {job.experienceLevel.replace("_", " ")}
          </Badge>
          {job.duration && (
            <Badge variant="outline" className="text-xs">
              <Icon icon="mdi:clock-outline" className="h-3 w-3 mr-1" />
              {job.duration}
            </Badge>
          )}
          {job.workload && (
            <Badge variant="outline" className="text-xs">
              {job.workload}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {job.description}
        </p>

        {/* Skills */}
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.skills.slice(0, 6).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 6 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{job.skills.length - 6}
              </Badge>
            )}
          </div>
        )}

        {/* Competition & Activity */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg mb-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Proposals</div>
            <div className={`font-semibold ${competition.color}`}>
              {job.totalApplicants}
            </div>
            <div className={`text-xs ${competition.color}`}>{competition.text}</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="text-xs text-muted-foreground mb-1">Connects</div>
            <div className="font-semibold">{job.connectsRequired}</div>
            <div className="text-xs text-muted-foreground">required</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Interviewing</div>
            <div className="font-semibold">{job.interviewing}</div>
            <div className="text-xs text-muted-foreground">candidates</div>
          </div>
        </div>

        {/* Client Info */}
        <div className="border rounded-lg p-3 bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Client</span>
              {job.client.paymentVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Icon icon="mdi:check-decagram" className="h-4 w-4 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>Payment Verified</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="mdi:map-marker" className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {job.client.location.city}, {job.client.location.country}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Icon icon="mdi:star" className="h-3 w-3 text-yellow-500" />
              <span className="font-medium">{formatRating(job.client.rating)}</span>
              <span className="text-muted-foreground">({job.client.feedbackCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="mdi:cash" className="h-3 w-3 text-green-500" />
              <span>{formatMoney(job.client.totalSpent)} spent</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="mdi:briefcase" className="h-3 w-3 text-blue-500" />
              <span>{job.client.totalJobsPosted} jobs posted</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="mdi:percent" className="h-3 w-3 text-purple-500" />
              <span>{(job.client.hireRate * 100).toFixed(0)}% hire rate</span>
            </div>
          </div>

          {/* Review Averages */}
          <div className="mt-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Icon icon="mdi:thumb-up" className="h-3 w-3 text-green-500" />
                <span>Gives: {formatRating(job.client.avgRatingGiven)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon icon="mdi:thumb-down" className="h-3 w-3 text-orange-500" />
                <span>Receives: {formatRating(job.client.avgRatingReceived)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Screening Questions */}
        {job.questions.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 mb-1">
              <Icon icon="mdi:help-circle" className="h-3 w-3" />
              <span className="font-medium">{job.questions.length} screening questions</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon icon="mdi:clock-outline" className="h-3 w-3" />
          <span>{formatTimeAgo(job.publishedAt)}</span>
        </div>
        <Button size="sm" className="bg-[#14A800] hover:bg-[#14A800]/90" asChild>
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            <Icon icon="mdi:open-in-new" className="h-4 w-4 mr-1" />
            Apply on Upwork
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

