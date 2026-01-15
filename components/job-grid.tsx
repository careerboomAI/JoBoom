"use client"

import { JobCard, type JobResult } from "./job-card"
import { UpworkJobCard } from "./upwork-job-card"
import { FreelanceJobCard } from "./freelance-job-card"
import { IndeedJobCard } from "./indeed-job-card"
import { BehanceJobCard } from "./behance-job-card"
import type { UpworkJobCardData } from "@/types/upwork_job_search"
import type { FreelanceJobCardData } from "@/types/freelance_job_search"
import type { IndeedJobCardData } from "@/types/indeed_job_search"
import type { BehanceJobCardData } from "@/types/behance_job_search"

// Union type for all job types
export type AnyJobResult = JobResult | UpworkJobCardData | FreelanceJobCardData | IndeedJobCardData | BehanceJobCardData

interface JobGridProps {
  jobs: AnyJobResult[]
}

function isUpworkJob(job: AnyJobResult): job is UpworkJobCardData {
  return job.source === "upwork" && "client" in job && "budgetType" in job
}

function isFreelanceJob(job: AnyJobResult): job is FreelanceJobCardData {
  return job.source === "freelance" && "bidCount" in job && "matchedQuery" in job
}

function isIndeedJob(job: AnyJobResult): job is IndeedJobCardData {
  return job.source === "indeed" && "company" in job && "postedDate" in job
}

function isBehanceJob(job: AnyJobResult): job is BehanceJobCardData {
  return job.source === "behance" && "creator" in job && "jobType" in job
}

export function JobGrid({ jobs }: JobGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => {
        if (isUpworkJob(job)) {
          return <UpworkJobCard key={`${job.source}-${job.id}`} job={job} />
        }
        if (isFreelanceJob(job)) {
          return <FreelanceJobCard key={`${job.source}-${job.id}`} job={job} />
        }
        if (isIndeedJob(job)) {
          return <IndeedJobCard key={`${job.source}-${job.id}`} job={job} />
        }
        if (isBehanceJob(job)) {
          return <BehanceJobCard key={`${job.source}-${job.id}`} job={job} />
        }
        return <JobCard key={`${job.source}-${job.id}`} job={job as JobResult} />
      })}
    </div>
  )
}
