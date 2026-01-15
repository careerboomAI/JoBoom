/**
 * Indeed Job Search Types
 * Based on Apify's cheapget/indeed-job-search
 */

// ============================================
// INPUT PARAMETERS (for Apify actor)
// ============================================

export interface IndeedJobSearchParams {
  /** Job titles, skills, or company names to search for */
  search_terms: string[]
  /** Target country where jobs are located */
  country: string
  /** Specify city or region (optional) */
  location?: string
  /** Filter jobs posted within this time period (e.g., "7 days", "2 weeks", "1 month") */
  posted_since: string
  /** Maximum number of job listings per search term */
  max_results: number
}

// Supported countries for Indeed
export const INDEED_COUNTRIES = [
  "Argentina", "Australia", "Austria", "Bahrain", "Bangladesh", "Belgium", "Bulgaria", 
  "Brazil", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cyprus",
  "Czech Republic", "Denmark", "Ecuador", "Egypt", "Estonia", "Finland", "France", 
  "Germany", "Greece", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland", "Israel",
  "Italy", "Japan", "Kuwait", "Latvia", "Lithuania", "Luxembourg", "Malaysia", "Malta",
  "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman", 
  "Pakistan", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Saudi Arabia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea",
  "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "Ukraine", 
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam"
] as const

export type IndeedCountry = typeof INDEED_COUNTRIES[number]

// ============================================
// OUTPUT / JOB RESULT (from Apify)
// ============================================

export interface IndeedJobResult {
  processor: string
  processed_at: string
  platform: string
  platform_url: string
  official_url: string | null
  title: string
  posted_date: string
  location: string
  is_remote: boolean
  description: string
  job_type: string | null
  job_level: string | null
  job_function: string | null
  listing_type: string | null
  emails: string | null
  skills: string | null
  work_from_home: string | null
  vacancy_count: number | null
  experience_range: string | null
  salary_period: string | null
  salary_minimum: number | null
  salary_maximum: number | null
  salary_currency: string | null
  company_name: string
  company_industry: string | null
  company_url: string | null
  company_website: string | null
  company_logo: string | null
  company_addresses: string | null
  company_revenue: string | null
  company_description: string | null
  company_rating: number | null
  employee_count: string | null
  review_count: number | null
}

// ============================================
// AI QUERY GENERATION
// ============================================

export interface GeneratedIndeedSearchQuery {
  description: string
  search_terms: string[]
  country: string
  location?: string
  posted_since: string
  relevanceScore: number
  reasoning: string
}

export interface CreateIndeedSearchQueryOutput {
  success: boolean
  generatedQuery: GeneratedIndeedSearchQuery
  originalQuery: string
  error?: string
}

// ============================================
// TRANSFORMED JOB RESULT (for frontend card)
// ============================================

export interface IndeedJobCardData {
  id: string
  source: "indeed"
  
  // Job details
  title: string
  description: string
  url: string
  officialUrl: string | null
  
  // Location
  location: string
  isRemote: boolean
  workFromHome: string | null
  
  // Employment
  jobType: string | null
  jobLevel: string | null
  jobFunction: string | null
  listingType: string | null
  vacancyCount: number | null
  experienceRange: string | null
  
  // Salary
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  salaryPeriod: string | null
  
  // Skills
  skills: string[]
  
  // Dates
  postedDate: string
  
  // Company info
  company: {
    name: string
    industry: string | null
    url: string | null
    website: string | null
    logo: string | null
    addresses: string | null
    revenue: string | null
    description: string | null
    rating: number | null
    employeeCount: string | null
    reviewCount: number | null
  }
  
  // Contact
  emails: string | null
}

/**
 * Generate a unique ID from Indeed job URL
 */
function extractJobId(url: string): string {
  const match = url.match(/jk=([a-zA-Z0-9]+)/)
  return match ? match[1] : Math.random().toString(36).slice(2)
}

/**
 * Parse skills string into array
 */
function parseSkills(skillsStr: string | null): string[] {
  if (!skillsStr) return []
  return skillsStr.split(',').map(s => s.trim()).filter(s => s.length > 0)
}

/**
 * Strip markdown and HTML from description
 */
function sanitizeDescription(desc: string | null): string {
  if (!desc) return ""
  // Remove markdown headers, bold, etc.
  return desc
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\\-/g, '-')
    .replace(/<[^>]*>/g, '')
    .substring(0, 500)
}

/**
 * Transform raw Indeed job to frontend card format
 */
export function transformIndeedJob(job: IndeedJobResult): IndeedJobCardData {
  return {
    id: extractJobId(job.platform_url),
    source: "indeed",
    
    // Job details
    title: job.title || "Untitled Position",
    description: sanitizeDescription(job.description),
    url: job.platform_url || "",
    officialUrl: job.official_url,
    
    // Location
    location: job.location || "Location not specified",
    isRemote: job.is_remote || false,
    workFromHome: job.work_from_home,
    
    // Employment
    jobType: job.job_type,
    jobLevel: job.job_level,
    jobFunction: job.job_function,
    listingType: job.listing_type,
    vacancyCount: job.vacancy_count,
    experienceRange: job.experience_range,
    
    // Salary
    salaryMin: job.salary_minimum,
    salaryMax: job.salary_maximum,
    salaryCurrency: job.salary_currency,
    salaryPeriod: job.salary_period,
    
    // Skills
    skills: parseSkills(job.skills),
    
    // Dates
    postedDate: job.posted_date || "",
    
    // Company info
    company: {
      name: job.company_name || "Unknown Company",
      industry: job.company_industry,
      url: job.company_url,
      website: job.company_website,
      logo: job.company_logo,
      addresses: job.company_addresses,
      revenue: job.company_revenue,
      description: job.company_description,
      rating: job.company_rating,
      employeeCount: job.employee_count,
      reviewCount: job.review_count,
    },
    
    // Contact
    emails: job.emails,
  }
}

