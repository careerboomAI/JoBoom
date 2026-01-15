/**
 * Behance Job Search Types
 * Based on Apify's scrapestorm/behance-jobs-search-scraper-fast-and-cheap
 */

// ============================================
// INPUT PARAMETERS (for Apify actor)
// ============================================

export interface BehanceJobSearchParams {
  /** The keyword to search for on Behance Jobs */
  keyword: string
  /** Maximum number of results to scrape */
  maxitems: number
}

// ============================================
// OUTPUT / JOB RESULT (from Apify)
// ============================================

export interface BehanceJobResult {
  job_id: number
  title: string
  job_type: "FULLTIME" | "FREELANCE" | "PARTTIME" | "CONTRACT" | "INTERNSHIP" | string
  job_status: "ACTIVE" | "CLOSED" | string
  job_url: string
  company_name: string
  company_url: string
  location: string
  short_description: string
  application_url: string
  creator_name: string
  creator_url: string
  creator_image: string
}

// ============================================
// AI QUERY GENERATION
// ============================================

export interface GeneratedBehanceSearchQuery {
  description: string
  keyword: string
  relevanceScore: number
  reasoning: string
}

export interface CreateBehanceSearchQueryOutput {
  success: boolean
  generatedQuery: GeneratedBehanceSearchQuery
  originalQuery: string
  error?: string
}

// ============================================
// TRANSFORMED JOB RESULT (for frontend card)
// ============================================

export interface BehanceJobCardData {
  id: string
  source: "behance"
  
  // Job details
  title: string
  description: string
  url: string
  applicationUrl: string
  
  // Job meta
  jobType: string
  jobStatus: string
  
  // Location
  location: string
  
  // Company info
  company: {
    name: string
    url: string
  }
  
  // Creator info (person who posted)
  creator: {
    name: string
    url: string
    image: string
  }
}

/**
 * Format job type for display
 */
function formatJobType(jobType: string): string {
  const typeMap: Record<string, string> = {
    "FULLTIME": "Full-time",
    "FREELANCE": "Freelance",
    "PARTTIME": "Part-time",
    "CONTRACT": "Contract",
    "INTERNSHIP": "Internship",
  }
  return typeMap[jobType.toUpperCase()] || jobType
}

/**
 * Transform raw Behance job to frontend card format
 */
export function transformBehanceJob(job: BehanceJobResult): BehanceJobCardData {
  return {
    id: String(job.job_id),
    source: "behance",
    
    // Job details
    title: job.title || "Untitled Position",
    description: job.short_description || "",
    url: job.job_url || "",
    applicationUrl: job.application_url || job.job_url || "",
    
    // Job meta
    jobType: formatJobType(job.job_type || ""),
    jobStatus: job.job_status || "ACTIVE",
    
    // Location
    location: job.location || "Anywhere",
    
    // Company info
    company: {
      name: job.company_name || "Unknown Company",
      url: job.company_url || "",
    },
    
    // Creator info
    creator: {
      name: job.creator_name || "",
      url: job.creator_url || "",
      image: job.creator_image || "",
    },
  }
}

