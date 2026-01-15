/**
 * Upwork Job Search Types
 * Based on Apify's fasty_dev/upwork-job-scraper
 */

// ============================================
// INPUT PARAMETERS
// ============================================

export interface UpworkJobSearchParams {
  /** Search term for finding jobs (e.g., 'React developer'). Leave empty to fetch all available jobs */
  keywords?: string
  /** Maximum number of jobs to retrieve (10-250) */
  limit: number
  /** Starting position for pagination (0-1000) */
  offset?: number
  /** Order results by newest postings or most relevant */
  sortby: "newest" | "relevance"
  /** Filter by required experience level */
  experience_level?: ("entry_level" | "intermediate" | "expert")[]
  /** Budget filters */
  budget?: {
    /** Include hourly jobs */
    hourly?: boolean
    /** Minimum hourly rate ($/hour) */
    min_budget_hourly?: number
    /** Maximum hourly rate ($/hour) */
    max_budget_hourly?: number
    /** Include fixed-price jobs */
    fixed_price?: boolean
    /** Minimum project budget (USD) */
    min_budget_fixed_price?: number
    /** Maximum project budget (USD) */
    max_budget_fixed_price?: number
  }
  /** Filter by competition level based on number of submitted proposals */
  numbers_of_proposals?: ("less_than_5" | "5_to_10" | "10_to_15" | "15_to_20" | "20_to_50")[]
  /** Only show jobs from clients with verified payment methods */
  client_payment_verified?: boolean
  /** Filter by client's hiring track record */
  client_history?: ("no_hires" | "1_to_9_hires" | "10_plus_hires")[]
  /** Filter by expected project duration */
  project_length?: ("less_than_1_month" | "1_to_3_months" | "3_to_6_months" | "more_than_6_months")[]
  /** Filter by expected time commitment per week */
  hours_per_week?: ("less_than_30" | "more_than_30")[]
  /** Only show jobs with potential for long-term employment */
  contract_to_hire_role?: boolean
}

// ============================================
// OUTPUT / JOB RESULT
// ============================================

export interface UpworkBudget {
  type: "FIXED" | "HOURLY"
  fixed_amount: number
  min_hourly_rate: number
  max_hourly_rate: number
}

export interface UpworkQualifications {
  countries: string[]
  languages: string[]
  min_job_success_score: number
  pref_english_skill: string
  rising_talent: boolean
}

export interface UpworkClientLocation {
  city: string
  country: string
}

export interface UpworkClientStats {
  score: number
  feedback_count: number
  total_spent: number
  avg_hourly_rate: number
  total_job_posted: number
  total_job_open: number
  total_job_with_hires: number
  hire_rate: number
}

export interface UpworkFeedback {
  score: number
  comment: string
}

export interface UpworkContractor {
  id: string
  name: string
}

export interface UpworkJobHistoryItem {
  id: string
  uuid: string
  title: string
  type: "FIXED" | "HOURLY"
  total_charge: number
  total_hours: number
  feedback_to_worker: UpworkFeedback
  feedback_to_client: UpworkFeedback
  contractor: UpworkContractor
}

export interface UpworkClient {
  id: string
  name: string
  industry: string
  size: number
  payment_verified: boolean
  phone_verified: boolean
  location: UpworkClientLocation
  stats: UpworkClientStats
  job_history: UpworkJobHistoryItem[]
}

export interface UpworkActivity {
  total_applicants: number
  client_last_viewed: string
  interviewing: number
  invited: number
  unanswered_invitations: number
}

export interface UpworkJobResult {
  id: string
  uuid: string
  link: string
  title: string
  description: string
  budget: UpworkBudget
  skills: string[]
  published_at: string
  person_to_hire: number
  category_group: string
  category: string
  duration: string
  workload: string
  contractor_tier: "ENTRY_LEVEL" | "INTERMEDIATE" | "EXPERT"
  qualifications: UpworkQualifications
  questions: string[]
  connect_required: number
  position: string
  client: UpworkClient
  activity: UpworkActivity
  attachments: string[]
}

// ============================================
// AI QUERY GENERATION
// ============================================

export interface GeneratedUpworkSearchQuery {
  description: string
  params: UpworkJobSearchParams
  relevanceScore: number
  reasoning: string
}

export interface CreateUpworkSearchQueryOutput {
  success: boolean
  queries: GeneratedUpworkSearchQuery[]
  originalQuery: string
  error?: string
}

// ============================================
// TRANSFORMED JOB RESULT (for frontend)
// ============================================

export interface UpworkJobCardData {
  id: string
  source: "upwork"
  
  // Job details
  title: string
  description: string
  url: string
  
  // Budget
  budgetType: "FIXED" | "HOURLY"
  budgetAmount: number | null // Fixed amount or null for hourly
  hourlyRateMin: number | null
  hourlyRateMax: number | null
  
  // Category
  category: string
  categoryGroup: string
  
  // Requirements
  skills: string[]
  experienceLevel: string
  duration: string
  workload: string
  questions: string[]
  
  // Timing
  publishedAt: string
  
  // Competition
  totalApplicants: number
  connectsRequired: number
  clientLastViewed: string | null
  interviewing: number
  
  // Client info
  client: {
    id: string
    name: string
    industry: string
    companySize: number
    paymentVerified: boolean
    location: {
      city: string
      country: string
    }
    // Stats
    rating: number
    feedbackCount: number
    totalSpent: number
    avgHourlyRate: number
    totalJobsPosted: number
    hireRate: number
    // Calculated review averages
    avgRatingGiven: number // Average score client gives to freelancers
    avgRatingReceived: number // Average score client receives from freelancers
    recentReviews: {
      jobTitle: string
      freelancerName: string
      scoreGiven: number
      scoreReceived: number
      commentGiven: string
      commentReceived: string
    }[]
  }
  
  // Qualifications
  requiredCountries: string[]
  requiredLanguages: string[]
  minJobSuccessScore: number
  preferredEnglishSkill: string
  risingTalentOnly: boolean
  
  // Contract potential
  contractToHire: boolean
  personToHire: number
  
  // Attachments
  attachments: string[]
}

/**
 * Calculate average ratings from job history
 */
export function calculateClientReviewAverages(jobHistory: UpworkJobHistoryItem[]): {
  avgRatingGiven: number
  avgRatingReceived: number
  recentReviews: UpworkJobCardData["client"]["recentReviews"]
} {
  const validGiven = jobHistory.filter(j => j.feedback_to_worker?.score > 0)
  const validReceived = jobHistory.filter(j => j.feedback_to_client?.score > 0)
  
  const avgRatingGiven = validGiven.length > 0 
    ? validGiven.reduce((sum, j) => sum + j.feedback_to_worker.score, 0) / validGiven.length 
    : 0
    
  const avgRatingReceived = validReceived.length > 0
    ? validReceived.reduce((sum, j) => sum + j.feedback_to_client.score, 0) / validReceived.length
    : 0
  
  // Get recent reviews (up to 5)
  const recentReviews = jobHistory.slice(0, 5).map(j => ({
    jobTitle: j.title,
    freelancerName: j.contractor?.name || "Unknown",
    scoreGiven: j.feedback_to_worker?.score || 0,
    scoreReceived: j.feedback_to_client?.score || 0,
    commentGiven: j.feedback_to_worker?.comment || "",
    commentReceived: j.feedback_to_client?.comment || "",
  }))
  
  return { avgRatingGiven, avgRatingReceived, recentReviews }
}

/**
 * Transform raw Upwork job to frontend card format
 */
export function transformUpworkJob(job: UpworkJobResult): UpworkJobCardData {
  const reviewAverages = calculateClientReviewAverages(job.client?.job_history || [])
  
  return {
    id: job.id,
    source: "upwork",
    
    // Job details
    title: job.title,
    description: job.description,
    url: job.link,
    
    // Budget
    budgetType: job.budget.type,
    budgetAmount: job.budget.type === "FIXED" ? job.budget.fixed_amount : null,
    hourlyRateMin: job.budget.type === "HOURLY" ? job.budget.min_hourly_rate : null,
    hourlyRateMax: job.budget.type === "HOURLY" ? job.budget.max_hourly_rate : null,
    
    // Category
    category: job.category,
    categoryGroup: job.category_group,
    
    // Requirements
    skills: job.skills || [],
    experienceLevel: job.contractor_tier,
    duration: job.duration,
    workload: job.workload,
    questions: job.questions || [],
    
    // Timing
    publishedAt: job.published_at,
    
    // Competition
    totalApplicants: job.activity?.total_applicants || 0,
    connectsRequired: job.connect_required,
    clientLastViewed: job.activity?.client_last_viewed || null,
    interviewing: job.activity?.interviewing || 0,
    
    // Client info
    client: {
      id: job.client?.id || "",
      name: job.client?.name || "",
      industry: job.client?.industry || "",
      companySize: job.client?.size || 0,
      paymentVerified: job.client?.payment_verified || false,
      location: {
        city: job.client?.location?.city || "",
        country: job.client?.location?.country || "",
      },
      rating: job.client?.stats?.score || 0,
      feedbackCount: job.client?.stats?.feedback_count || 0,
      totalSpent: job.client?.stats?.total_spent || 0,
      avgHourlyRate: job.client?.stats?.avg_hourly_rate || 0,
      totalJobsPosted: job.client?.stats?.total_job_posted || 0,
      hireRate: job.client?.stats?.hire_rate || 0,
      avgRatingGiven: reviewAverages.avgRatingGiven,
      avgRatingReceived: reviewAverages.avgRatingReceived,
      recentReviews: reviewAverages.recentReviews,
    },
    
    // Qualifications
    requiredCountries: job.qualifications?.countries || [],
    requiredLanguages: job.qualifications?.languages || [],
    minJobSuccessScore: job.qualifications?.min_job_success_score || 0,
    preferredEnglishSkill: job.qualifications?.pref_english_skill || "ANY",
    risingTalentOnly: job.qualifications?.rising_talent || false,
    
    // Contract potential
    contractToHire: false, // Not directly in output, inferred from input
    personToHire: job.person_to_hire,
    
    // Attachments
    attachments: job.attachments || [],
  }
}

