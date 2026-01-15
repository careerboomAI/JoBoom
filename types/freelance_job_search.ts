/**
 * Freelance.com Job Search Types
 * Based on Apify's getdataforme/freelancer-jobs-scraper
 */

// ============================================
// INPUT PARAMETERS (for Apify actor)
// ============================================

export interface FreelanceJobSearchParams {
  /** Array of search terms (e.g., "WordPress", "React", "Python") */
  queries: string[]
  /** Maximum number of job listings to scrape */
  item_limit: number
  /** Proxy configuration - always use Apify proxy */
  proxyConfiguration: {
    useApifyProxy: boolean
    apifyProxyGroups: string[]
  }
}

// ============================================
// OUTPUT / JOB RESULT (from Apify)
// ============================================

export interface FreelanceJobResult {
  project_id: number
  title: string
  url: string
  description: string
  bid_avg: string // e.g., "$90", "$52 / hr"
  bid_count: number
  time_left: string // e.g., "6 days left"
  budget_range: string // e.g., "$20 - $163", "min $50 / hr"
  minbudget: string // e.g., "$20"
  maxbudget: string // e.g., "$163" or ""
  skills: string[]
  payment_verified: boolean
  is_contest: boolean
  featured: boolean
  urgent: boolean
  fulltime: boolean
  query: string // The search query that found this job
}

// ============================================
// AI QUERY GENERATION
// ============================================

export interface GeneratedFreelanceSearchQuery {
  description: string
  queries: string[] // Array of search terms
  relevanceScore: number
  reasoning: string
}

export interface CreateFreelanceSearchQueryOutput {
  success: boolean
  generatedQuery: GeneratedFreelanceSearchQuery
  originalQuery: string
  error?: string
}

// ============================================
// TRANSFORMED JOB RESULT (for frontend card)
// ============================================

export interface FreelanceJobCardData {
  id: string
  source: "freelance"
  
  // Job details
  title: string
  description: string
  url: string
  
  // Budget
  budgetRange: string
  minBudget: number | null
  maxBudget: number | null
  isHourly: boolean
  
  // Bids/Competition
  bidAverage: number | null
  bidCount: number
  timeLeft: string
  
  // Skills
  skills: string[]
  
  // Flags
  paymentVerified: boolean
  isContest: boolean
  isFeatured: boolean
  isUrgent: boolean
  isFulltime: boolean
  
  // Query that found this job
  matchedQuery: string
}

/**
 * Parse budget string to number
 * Handles: "$250", "$50 / hr", ""
 */
function parseBudget(budgetStr: string): number | null {
  if (!budgetStr) return null
  const match = budgetStr.match(/\$?([\d,]+(?:\.\d+)?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''))
  }
  return null
}

/**
 * Check if budget is hourly
 */
function isHourlyBudget(budgetRange: string): boolean {
  return budgetRange.toLowerCase().includes('/ hr') || budgetRange.toLowerCase().includes('/hr')
}

/**
 * Safely convert description to string and strip HTML
 */
function sanitizeDescription(desc: any): string {
  if (!desc) return ""
  if (typeof desc === "string") {
    return desc.replace(/<[^>]*>/g, '').substring(0, 500)
  }
  if (typeof desc === "object") {
    // Sometimes description might be an object, try to stringify
    return JSON.stringify(desc).substring(0, 500)
  }
  return String(desc).substring(0, 500)
}

/**
 * Transform raw Freelance.com job to frontend card format
 */
export function transformFreelanceJob(job: FreelanceJobResult): FreelanceJobCardData {
  return {
    id: job.project_id?.toString() || Math.random().toString(36).slice(2),
    source: "freelance",
    
    // Job details
    title: job.title || "Untitled Project",
    description: sanitizeDescription(job.description),
    url: job.url || "",
    
    // Budget
    budgetRange: job.budget_range || "",
    minBudget: parseBudget(job.minbudget),
    maxBudget: parseBudget(job.maxbudget),
    isHourly: isHourlyBudget(job.budget_range || ""),
    
    // Bids/Competition
    bidAverage: parseBudget(job.bid_avg),
    bidCount: job.bid_count || 0,
    timeLeft: job.time_left || "",
    
    // Skills
    skills: job.skills || [],
    
    // Flags
    paymentVerified: job.payment_verified || false,
    isContest: job.is_contest || false,
    isFeatured: job.featured || false,
    isUrgent: job.urgent || false,
    isFulltime: job.fulltime || false,
    
    // Query
    matchedQuery: job.query || "",
  }
}

