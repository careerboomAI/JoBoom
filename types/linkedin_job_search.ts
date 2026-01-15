/**
 * LinkedIn Job Search API Types
 * Based on Apify's Advanced LinkedIn Job Search API
 */

// ============================================
// INPUT TYPES - Request to generate search queries
// ============================================

/**
 * Input for the /api/create-search-query/linkedin endpoint
 */
export interface CreateLinkedInSearchQueryInput {
  /** User's search query (e.g., "Technical support engineer in Dubai in the last 7 days") */
  query: string
  /** User profile data from CV and/or LinkedIn */
  userProfile?: {
    skills?: string[]
    workExperience?: {
      title: string
      company: string
      description?: string
    }[]
    education?: {
      institution: string
      degree?: string
      fieldOfStudy?: string
    }[]
    headline?: string
    summary?: string
    location?: string
    languages?: string[]
    certifications?: string[]
    industry?: string
  }
}

// ============================================
// LINKEDIN JOB SEARCH API PARAMETERS
// ============================================

/** Time range options for job listings */
export type TimeRange = "1h" | "24h" | "7d"

/** Seniority level options */
export type SeniorityLevel = 
  | "Associate" 
  | "Director" 
  | "Executive" 
  | "Mid-Senior level" 
  | "Entry level" 
  | "Not Applicable" 
  | "Internship"

/** Employment type options */
export type EmploymentType = 
  | "FULL_TIME" 
  | "PART_TIME" 
  | "CONTRACTOR" 
  | "TEMPORARY" 
  | "INTERN" 
  | "VOLUNTEER" 
  | "PER_DIEM" 
  | "OTHER"

/** AI Work arrangement options */
export type WorkArrangement = 
  | "On-site" 
  | "Hybrid" 
  | "Remote OK" 
  | "Remote Solely"

/** AI Experience level options */
export type ExperienceLevel = "0-2" | "2-5" | "5-10" | "10+"

/** AI Taxonomy categories */
export type TaxonomyCategory = 
  | "Technology"
  | "Healthcare"
  | "Management & Leadership"
  | "Finance & Accounting"
  | "Human Resources"
  | "Sales"
  | "Marketing"
  | "Customer Service & Support"
  | "Education"
  | "Legal"
  | "Engineering"
  | "Science & Research"
  | "Trades"
  | "Construction"
  | "Manufacturing"
  | "Logistics"
  | "Creative & Media"
  | "Hospitality"
  | "Environmental & Sustainability"
  | "Retail"
  | "Data & Analytics"
  | "Software"
  | "Energy"
  | "Agriculture"
  | "Social Services"
  | "Administrative"
  | "Government & Public Sector"
  | "Art & Design"
  | "Food & Beverage"
  | "Transportation"
  | "Consulting"
  | "Sports & Recreation"
  | "Security & Safety"

/**
 * LinkedIn Job Search API Input Parameters
 * Sent to Apify's Advanced LinkedIn Job Search API
 */
export interface LinkedInJobSearchParams {
  // Time & Limit
  /** Time range for job listings: "1h", "24h", or "7d" */
  timeRange?: TimeRange
  /** Maximum jobs to return (10-5000) */
  limit?: number

  // Search Parameters
  /** Terms to search in job titles. Use :* for prefix matching */
  titleSearch?: string[]
  /** Terms to exclude from job titles */
  titleExclusionSearch?: string[]
  /** Terms to search in job locations. Don't use abbreviations */
  locationSearch?: string[]
  /** Terms to exclude from job locations */
  locationExclusionSearch?: string[]
  /** Terms to search in job descriptions (includes title) */
  descriptionSearch?: string[]
  /** Terms to exclude from job descriptions */
  descriptionExclusionSearch?: string[]
  /** Terms to search in organization names */
  organizationSearch?: string[]
  /** Terms to exclude from organization names */
  organizationExclusionSearch?: string[]
  /** Terms to search in organization descriptions */
  organizationDescriptionSearch?: string[]
  /** Terms to exclude from organization descriptions */
  organizationDescriptionExclusionSearch?: string[]

  // Description Type
  /** Format of job description: "text" or empty */
  descriptionType?: "text" | ""

  // Filters
  /** Filter for remote jobs only */
  remote?: boolean
  /** Filter by seniority level */
  seniorityFilter?: SeniorityLevel[]
  /** Filter for external apply URL jobs (opposite of Easy Apply) */
  externalApplyUrl?: boolean
  /** Filter for LinkedIn Easy Apply jobs */
  directApply?: boolean
  /** Filter by LinkedIn organization slugs */
  organizationSlugFilter?: string[]
  /** Exclude specific organization slugs */
  organizationSlugExclusionFilter?: string[]
  /** Filter by LinkedIn industries */
  industryFilter?: string[]
  /** Maximum number of employees in company */
  organizationEmployeesLte?: number
  /** Minimum number of employees in company */
  organizationEmployeesGte?: number
  /** Filter out recruitment agencies */
  removeAgency?: boolean
  /** Filter by employment type */
  EmploymentTypeFilter?: EmploymentType[]

  // AI Filters (BETA)
  /** Include AI enriched fields */
  includeAi?: boolean
  /** Filter by work arrangement */
  aiWorkArrangementFilter?: WorkArrangement[]
  /** Filter for jobs with salary info */
  aiHasSalary?: boolean
  /** Filter by years of experience */
  aiExperienceLevelFilter?: ExperienceLevel[]
  /** Filter for visa sponsorship jobs */
  aiVisaSponsorshipFilter?: boolean
  /** Filter by AI taxonomies */
  aiTaxonomiesFilter?: TaxonomyCategory[]
  /** Filter by primary AI taxonomy */
  aiTaxonomiesPrimaryFilter?: TaxonomyCategory[]
  /** Exclude jobs by AI taxonomies */
  aiTaxonomiesExclusionFilter?: TaxonomyCategory[]
}

// ============================================
// OUTPUT TYPES - Response from ChatGPT
// ============================================

/**
 * A single search query generated by ChatGPT
 */
export interface GeneratedSearchQuery {
  /** Human-readable description of what this query is searching for */
  description: string
  /** The search parameters for the LinkedIn Job Search API */
  params: LinkedInJobSearchParams
  /** Priority/relevance score (1-10, higher is more relevant) */
  relevanceScore: number
  /** Reasoning for why this query was generated */
  reasoning: string
}

/**
 * Response from /api/create-search-query/linkedin
 */
export interface CreateLinkedInSearchQueryOutput {
  /** Whether the generation was successful */
  success: boolean
  /** Array of generated search queries (typically 2-4 queries) */
  queries: GeneratedSearchQuery[]
  /** Summary of the user's profile used for generation */
  profileSummary?: string
  /** The original user query */
  originalQuery: string
  /** Any errors that occurred */
  error?: string
}

// ============================================
// JOB RESULT TYPES - From Apify API
// ============================================

/**
 * Location data from LinkedIn job listing
 */
export interface JobLocationDerived {
  city?: string
  admin?: string // state/region
  country?: string
}

/**
 * Salary data from LinkedIn job listing
 */
export interface JobSalaryRaw {
  currency?: string
  value?: number
  minValue?: number
  maxValue?: number
  unitText?: string // HOUR/DAY/WEEK/MONTH/YEAR
}

/**
 * A job listing returned from the LinkedIn Job Search API
 */
export interface LinkedInJobResult {
  id: string
  title: string
  organization: string
  organization_url?: string
  organization_logo?: string
  date_posted?: string
  date_created?: string
  date_validthrough?: string
  locations_raw?: any[]
  locations_derived?: JobLocationDerived[]
  location_type?: string // "TELECOMMUTE" for remote
  salary_raw?: JobSalaryRaw
  employment_type?: string[]
  url: string
  source?: string
  description_text?: string
  description_html?: string
  cities_derived?: string[]
  regions_derived?: string[]
  countries_derived?: string[]
  remote_derived?: boolean
  seniority?: string
  directapply?: boolean
  external_apply_url?: string
  linkedin_org_employees?: number
  linkedin_org_industry?: string
  linkedin_org_description?: string
  linkedin_org_recruitment_agency_derived?: boolean
  linkedin_org_size?: string
  linkedin_org_headquarters?: string
  linkedin_org_specialties?: string[]
  linkedin_org_url?: string
  linkedin_org_slogan?: string
  linkedin_org_followers?: number
  linkedin_org_type?: string
  linkedin_org_foundeddate?: string
  linkedin_org_locations?: string[]
  linkedin_org_slug?: string
  
  // AI enriched fields
  ai_salary_currency?: string
  ai_salary_value?: number
  ai_salary_minvalue?: number
  ai_salary_maxvalue?: number
  ai_salary_unittext?: string
  ai_benefits?: string[]
  ai_experience_level?: string
  ai_work_arrangement?: string
  ai_remote_location?: string[]
  ai_key_skills?: string[]
  ai_core_responsibilities?: string
  ai_requirements_summary?: string
  ai_employment_type?: string[]
  ai_visa_sponsorship?: boolean
  ai_keywords?: string[]
  ai_taxonomies_a?: string[]
}

