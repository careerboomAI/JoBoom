"use client"

import { Icon } from "@iconify/react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { FreelanceJobCardData } from "@/types/freelance_job_search"

interface FreelanceJobCardProps {
  job: FreelanceJobCardData
}

export function FreelanceJobCard({ job }: FreelanceJobCardProps) {
  const formatBudget = () => {
    if (job.minBudget && job.maxBudget) {
      const suffix = job.isHourly ? "/hr" : ""
      return `$${job.minBudget.toLocaleString()} - $${job.maxBudget.toLocaleString()}${suffix}`
    }
    if (job.minBudget) {
      const suffix = job.isHourly ? "/hr" : ""
      return `From $${job.minBudget.toLocaleString()}${suffix}`
    }
    return job.budgetRange || "Budget not specified"
  }

  const getCompetitionLevel = (bids: number) => {
    if (bids < 10) return { text: "Low", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" }
    if (bids < 30) return { text: "Medium", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30" }
    if (bids < 60) return { text: "High", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" }
    return { text: "Very High", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" }
  }

  const competition = getCompetitionLevel(job.bidCount)

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Source & Flags */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Icon icon="simple-icons:freelancer" className="h-4 w-4 text-[#29B2FE] flex-shrink-0" />
              
              {job.isUrgent && (
                <Badge variant="destructive" className="text-xs py-0 h-5">
                  <Icon icon="mdi:flash" className="h-3 w-3 mr-0.5" />
                  Urgent
                </Badge>
              )}
              
              {job.isFeatured && (
                <Badge className="text-xs py-0 h-5 bg-amber-500 hover:bg-amber-600">
                  <Icon icon="mdi:star" className="h-3 w-3 mr-0.5" />
                  Featured
                </Badge>
              )}
              
              {job.isContest && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  <Icon icon="mdi:trophy" className="h-3 w-3 mr-0.5" />
                  Contest
                </Badge>
              )}
              
              {job.isFulltime && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  Full-time
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
          </div>
          
          <Badge variant="secondary" className="flex-shrink-0 font-semibold text-sm whitespace-nowrap">
            {formatBudget()}
          </Badge>
        </div>

        {/* Time left */}
        {job.timeLeft && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <Icon icon="mdi:clock-outline" className="h-4 w-4" />
            <span>{job.timeLeft}</span>
          </div>
        )}
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

        {/* Competition & Bids */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg mb-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Bids</div>
            <div className={`font-semibold ${competition.color}`}>
              {job.bidCount}
            </div>
            <div className={`text-xs ${competition.color}`}>{competition.text}</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="text-xs text-muted-foreground mb-1">Avg Bid</div>
            <div className="font-semibold">
              {job.bidAverage ? `$${job.bidAverage.toLocaleString()}` : "N/A"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Payment</div>
            <div className="flex items-center justify-center gap-1">
              {job.paymentVerified ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Icon icon="mdi:check-decagram" className="h-5 w-5 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>Payment Verified</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Icon icon="mdi:alert-circle-outline" className="h-5 w-5 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent>Payment Not Verified</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {job.paymentVerified ? "Verified" : "Unverified"}
            </div>
          </div>
        </div>

        {/* Matched Query */}
        {job.matchedQuery && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Icon icon="mdi:magnify" className="h-3 w-3" />
            <span>Matched: "{job.matchedQuery}"</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {job.paymentVerified && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Icon icon="mdi:shield-check" className="h-3 w-3" />
              <span>Secure</span>
            </div>
          )}
        </div>
        <Button size="sm" className="bg-[#29B2FE] hover:bg-[#29B2FE]/90" asChild>
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            <Icon icon="mdi:open-in-new" className="h-4 w-4 mr-1" />
            Bid Now
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

