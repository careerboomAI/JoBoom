"use client"

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
  CheckCircle,
  Sparkles
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

export interface JobResult {
  id: string
  source: "linkedin" | "upwork" | "behance" | "glassdoor" | "indeed" | "freelance"
  
  // Job details
  title: string
  company: string
  companyUrl?: string
  companyLogo?: string
  url: string
  externalApplyUrl?: string
  
  // Location
  location: string
  isRemote?: boolean
  workArrangement?: string
  
  // Dates
  datePosted?: string
  dateValidThrough?: string
  
  // Employment
  employmentType?: string
  seniority?: string
  
  // Salary
  salary?: string | null
  
  // Description
  description?: string
  
  // Skills
  skills?: string[]
  
  // AI enriched
  experienceLevel?: string
  coreResponsibilities?: string
  requirementsSummary?: string
  benefits?: string[]
  visaSponsorship?: boolean
  taxonomies?: string[]
  
  // Company info
  companyInfo?: {
    industry?: string
    size?: string
    employees?: number
    headquarters?: string
    description?: string
    specialties?: string[]
  }
  
  // Flags
  isDirectApply?: boolean
  isAgency?: boolean
}

interface JobCardProps {
  job: JobResult
}

const SOURCE_CONFIG = {
  linkedin: {
    icon: "mdi:linkedin",
    color: "text-[#0077b5]",
    bgColor: "bg-[#0077b5]/10",
    solidBg: "bg-[#0077b5]/90",
    label: "LinkedIn",
  },
  upwork: {
    icon: "simple-icons:upwork",
    color: "text-[#14A800]",
    bgColor: "bg-[#14A800]/10",
    solidBg: "bg-[#14A800]/90",
    label: "Upwork",
  },
  behance: {
    icon: "mdi:behance",
    color: "text-[#1769ff]",
    bgColor: "bg-[#1769ff]/10",
    solidBg: "bg-[#1769ff]/90",
    label: "Behance",
  },
  glassdoor: {
    icon: "cib:glassdoor",
    color: "text-[#0CAA41]",
    bgColor: "bg-[#0CAA41]/10",
    solidBg: "bg-[#0CAA41]/90",
    label: "Glassdoor",
  },
  indeed: {
    icon: "simple-icons:indeed",
    color: "text-[#003A9B]",
    bgColor: "bg-[#003A9B]/10",
    solidBg: "bg-[#003A9B]/90",
    label: "Indeed",
  },
  freelance: {
    icon: "simple-icons:freelancer",
    color: "text-[#29B2FE]",
    bgColor: "bg-[#29B2FE]/10",
    solidBg: "bg-[#29B2FE]/90",
    label: "Freelance.com",
  },
}

function formatDate(dateString?: string): string {
  if (!dateString) return ""
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatEmploymentType(type?: string): string {
  if (!type) return ""
  
  const mapping: Record<string, string> = {
    "FULL_TIME": "Full-time",
    "PART_TIME": "Part-time",
    "CONTRACTOR": "Contract",
    "TEMPORARY": "Temporary",
    "INTERN": "Internship",
    "VOLUNTEER": "Volunteer",
    "PER_DIEM": "Per Diem",
    "OTHER": "Other",
  }
  
  return mapping[type] || type
}

export function JobCard({ job }: JobCardProps) {
  const sourceConfig = SOURCE_CONFIG[job.source]
  
  const handleApply = () => {
    const applyUrl = job.externalApplyUrl || job.url
    window.open(applyUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <CardContent className="p-4 sm:p-5">
        {/* Header: Logo + Title + Source */}
        <div className="flex gap-3 sm:gap-4">
          {/* Company Logo */}
          <div className="relative flex-shrink-0">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
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
                <div className={cn(
                  "absolute -bottom-1 -right-1 rounded-full p-1.5 shadow-lg border-2 border-card cursor-default hover:scale-110 transition-transform",
                  sourceConfig.solidBg
                )}>
                  <Icon 
                    icon={sourceConfig.icon} 
                    className="h-3 w-3 text-white" 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Found on {sourceConfig.label}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Title & Company */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            
            <div className="flex items-center gap-1.5 mt-1">
              {job.companyUrl ? (
                <a
                  href={job.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors truncate"
                >
                  {job.company}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground truncate">
                  {job.company}
                </span>
              )}
              
              {job.companyInfo?.industry && (
                <span className="text-xs text-muted-foreground/60 hidden sm:inline">
                  • {job.companyInfo.industry}
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

          {/* Work Arrangement */}
          {job.workArrangement && (
            <div className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              <span>{job.workArrangement}</span>
            </div>
          )}

          {/* Employment Type */}
          {job.employmentType && (
            <div className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              <span>{formatEmploymentType(job.employmentType)}</span>
            </div>
          )}

          {/* Date Posted */}
          {job.datePosted && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(job.datePosted)}</span>
            </div>
          )}
        </div>

        {/* Salary */}
        {job.salary && (
          <div className="flex items-center gap-1.5 mt-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">{job.salary}</span>
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

        {/* AI Enriched badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {job.experienceLevel && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1">
                    <Users className="h-3 w-3" />
                    {job.experienceLevel} yrs
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Experience required</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {job.visaSponsorship && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1 border-green-500/50 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Visa Sponsorship
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>This job offers visa sponsorship</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {job.isDirectApply && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1 border-blue-500/50 text-blue-600">
                    <Sparkles className="h-3 w-3" />
                    Easy Apply
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Apply directly through LinkedIn</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {job.isAgency && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-500/50">
              Agency
            </Badge>
          )}
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            {job.companyInfo?.size && (
              <span>{job.companyInfo.size}</span>
            )}
          </div>

          <Button size="sm" onClick={handleApply} className="gap-1.5">
            Apply
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

