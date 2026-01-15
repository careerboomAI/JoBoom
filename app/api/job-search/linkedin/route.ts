import { NextRequest, NextResponse } from "next/server"
import { ApifyClient } from "apify-client"
import type { 
  LinkedInJobSearchParams, 
  LinkedInJobResult,
  CreateLinkedInSearchQueryOutput 
} from "@/types/linkedin_job_search"

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

/**
 * POST /api/job-search/linkedin
 * 
 * LinkedIn job search endpoint
 * 1. Takes user query and optional profile data
 * 2. Generates optimized search query using AI
 * 3. Calls Apify's LinkedIn Job Search API
 * 4. Returns job results
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("🚀 [LinkedIn] POST request received at", new Date().toISOString())
    
    const { query, userProfile } = await request.json()
    console.log("📥 [LinkedIn] Request body parsed. Query:", query)
    console.log("📥 [LinkedIn] User profile provided:", !!userProfile)

    if (!query) {
      console.log("❌ [LinkedIn] No query provided, returning 400")
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    if (!APIFY_API_TOKEN) {
      console.log("❌ [LinkedIn] APIFY_API_TOKEN not configured, returning 500")
      return NextResponse.json(
        { error: "APIFY_API_TOKEN not configured" },
        { status: 500 }
      )
    }
    console.log("✓ [LinkedIn] APIFY_API_TOKEN is configured")

    console.log("🔍 [LinkedIn] Starting job search for:", query)

    // Step 1: Generate optimized search query using AI
    console.log("⏳ [LinkedIn] Step 1: Generating optimized search query via AI...")
    const aiStartTime = Date.now()
    const searchQueryResponse = await generateSearchQuery(query, userProfile, request.url)
    console.log(`✓ [LinkedIn] AI query generated in ${Date.now() - aiStartTime}ms`)
    
    if (!searchQueryResponse.success || searchQueryResponse.queries.length === 0) {
      console.error("❌ [LinkedIn] Failed to generate search query:", searchQueryResponse.error)
      return NextResponse.json(
        { error: searchQueryResponse.error || "Failed to generate search query" },
        { status: 500 }
      )
    }

    const generatedQuery = searchQueryResponse.queries[0]
    console.log("🤖 [LinkedIn] AI Generated Query:", generatedQuery.description)
    console.log("📋 [LinkedIn] Search Params:", JSON.stringify(generatedQuery.params, null, 2))

    // Step 2: Call Apify LinkedIn Job Search API
    console.log("⏳ [LinkedIn] Step 2: Calling Apify LinkedIn Job Search API...")
    const apifyStartTime = Date.now()
    const jobs = await searchLinkedInJobs(generatedQuery.params)
    console.log(`✓ [LinkedIn] Apify search completed in ${Date.now() - apifyStartTime}ms`)
    
    console.log(`✅ [LinkedIn] Found ${jobs.length} jobs`)

    // Step 3: Transform jobs to our format for the frontend
    console.log("⏳ [LinkedIn] Step 3: Transforming jobs to frontend format...")
    const results = jobs.map(job => transformJobToResult(job))
    console.log(`✓ [LinkedIn] Transformed ${results.length} jobs`)

    const totalTime = Date.now() - startTime
    console.log(`🏁 [LinkedIn] Total request time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return NextResponse.json({
      results,
      totalResults: results.length,
      searchQuery: generatedQuery,
    })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    console.error(`❌ [LinkedIn] Error after ${totalTime}ms:`, error)
    console.error("❌ [LinkedIn] Error stack:", error.stack)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    return NextResponse.json(
      { error: error.message || "Failed to search LinkedIn jobs" },
      { status: 500 }
    )
  }
}

/**
 * Generate optimized search query using our AI endpoint
 */
async function generateSearchQuery(
  query: string, 
  userProfile: any,
  requestUrl: string
): Promise<CreateLinkedInSearchQueryOutput> {
  // Use the incoming request URL as base - this works correctly on Vercel
  // Same pattern as Indeed which works in production
  const fullUrl = new URL("/api/create-search-query/linkedin", requestUrl).toString()
  console.log("   📡 [LinkedIn] Calling AI endpoint:", fullUrl)
  
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, userProfile }),
  })

  console.log("   📡 [LinkedIn] AI endpoint response status:", response.status)

  if (!response.ok) {
    const error = await response.json()
    console.error("   ❌ [LinkedIn] AI endpoint error:", error)
    throw new Error(error.error || "Failed to generate search query")
  }

  const result = await response.json()
  console.log("   ✓ [LinkedIn] AI endpoint returned successfully")
  return result
}

/**
 * Fields to progressively remove when search returns 0 results
 * Ordered from most restrictive to least restrictive
 */
const RELAXABLE_FIELDS = [
  "descriptionSearch",
  "organizationSearch", 
  "organizationDescriptionSearch",
  "organizationDescriptionExclusionSearch",
  "seniorityFilter",
  "industryFilter",
  "organizationEmployeesLte",
  "organizationEmployeesGte",
  "EmploymentTypeFilter",
  "aiVisaSponsorshipFilter",
] as const

/**
 * Call Apify's Advanced LinkedIn Job Search API with retry logic
 * If no results are found, progressively removes restrictive fields and retries
 */
async function searchLinkedInJobs(params: LinkedInJobSearchParams): Promise<LinkedInJobResult[]> {
  const client = new ApifyClient({
    token: APIFY_API_TOKEN,
  })

  // Track which fields we've removed for logging
  const removedFields: string[] = []
  
  // Create a mutable copy of params
  let currentParams = { ...params }
  
  // Try initial search
  let results = await executeSearch(client, currentParams)
  
  // If we got results, return them
  if (results.length > 0) {
    console.log(`✅ Found ${results.length} jobs on first attempt`)
    return results
  }
  
  console.log("⚠️ No results found. Starting retry logic with field relaxation...")
  
  // Progressively remove fields and retry
  for (const field of RELAXABLE_FIELDS) {
    // Check if this field exists and has a value in current params
    const fieldValue = (currentParams as any)[field]
    const hasValue = fieldValue !== undefined && fieldValue !== null && 
      (Array.isArray(fieldValue) ? fieldValue.length > 0 : true)
    
    if (!hasValue) {
      continue // Skip fields that aren't set
    }
    
    // Remove this field
    const newParams = { ...currentParams }
    delete (newParams as any)[field]
    currentParams = newParams
    removedFields.push(field)
    
    console.log(`🔄 Retry #${removedFields.length}: Removed "${field}"`)
    console.log(`   Current params: ${JSON.stringify(Object.keys(currentParams).filter(k => (currentParams as any)[k] !== undefined))}`)
    
    // Execute search with relaxed params
    results = await executeSearch(client, currentParams)
    
    if (results.length > 0) {
      console.log(`✅ Found ${results.length} jobs after removing: ${removedFields.join(", ")}`)
      return results
    }
  }
  
  console.log(`❌ No results found even after removing all relaxable fields: ${removedFields.join(", ")}`)
  return []
}

/**
 * Execute a single search against Apify
 */
async function executeSearch(
  client: ApifyClient, 
  params: LinkedInJobSearchParams
): Promise<LinkedInJobResult[]> {
  const searchStartTime = Date.now()
  console.log("   📡 [Apify] Starting Actor call...")
  console.log("   📡 [Apify] Actor: fantastic-jobs/advanced-linkedin-job-search-api")
  console.log("   📡 [Apify] Params keys:", Object.keys(params).filter(k => (params as any)[k] !== undefined))

  try {
    // Run the Actor
    console.log("   ⏳ [Apify] Waiting for Actor to complete...")
    const run = await client.actor("fantastic-jobs/advanced-linkedin-job-search-api").call(params)
    console.log(`   ✓ [Apify] Actor run completed in ${Date.now() - searchStartTime}ms`)
    console.log(`   📊 [Apify] Run ID: ${run.id}`)
    console.log(`   📊 [Apify] Dataset ID: ${run.defaultDatasetId}`)
    console.log(`   📊 [Apify] Status: ${run.status}`)

    // Fetch results from the dataset
    console.log("   ⏳ [Apify] Fetching items from dataset...")
    const datasetStartTime = Date.now()
    const { items } = await client.dataset(run.defaultDatasetId).listItems()
    console.log(`   ✓ [Apify] Dataset fetch completed in ${Date.now() - datasetStartTime}ms`)
    console.log(`   📊 [Apify] Items retrieved: ${items.length}`)

    return items as unknown as LinkedInJobResult[]
  } catch (apifyError: any) {
    console.error(`   ❌ [Apify] Error after ${Date.now() - searchStartTime}ms:`, apifyError.message)
    console.error("   ❌ [Apify] Error details:", apifyError)
    throw apifyError
  }
}

/**
 * Transform LinkedIn job result to our frontend format
 */
function transformJobToResult(job: LinkedInJobResult) {
  return {
    id: job.id,
    source: "linkedin" as const,
    
    // Job details
    title: job.title,
    company: job.organization,
    companyUrl: job.organization_url,
    companyLogo: job.organization_logo,
    url: job.url,
    externalApplyUrl: job.external_apply_url,
    
    // Location
    location: job.locations_derived?.[0] || job.cities_derived?.[0] || "Location not specified",
    isRemote: job.remote_derived || job.ai_work_arrangement?.includes("Remote") || false,
    workArrangement: job.ai_work_arrangement,
    
    // Dates
    datePosted: job.date_posted,
    dateValidThrough: job.date_validthrough,
    
    // Employment
    employmentType: job.employment_type?.[0] || "FULL_TIME",
    seniority: job.seniority,
    
    // Salary
    salary: formatSalary(job),
    
    // Description
    description: job.description_text?.substring(0, 500) || "",
    
    // Skills
    skills: job.ai_key_skills || [],
    
    // AI enriched data
    experienceLevel: job.ai_experience_level,
    coreResponsibilities: job.ai_core_responsibilities,
    requirementsSummary: job.ai_requirements_summary,
    benefits: job.ai_benefits,
    visaSponsorship: job.ai_visa_sponsorship,
    taxonomies: job.ai_taxonomies_a,
    
    // Company info
    companyInfo: {
      industry: job.linkedin_org_industry,
      size: job.linkedin_org_size,
      employees: job.linkedin_org_employees,
      headquarters: job.linkedin_org_headquarters,
      description: job.linkedin_org_description?.substring(0, 300),
      specialties: job.linkedin_org_specialties,
    },
    
    // Flags
    isDirectApply: job.directapply,
    isAgency: job.linkedin_org_recruitment_agency_derived,
  }
}

/**
 * Format salary information
 */
function formatSalary(job: LinkedInJobResult): string | null {
  // Try AI-extracted salary first
  if (job.ai_salary_currency && (job.ai_salary_value || job.ai_salary_minvalue)) {
    const currency = job.ai_salary_currency
    const unit = job.ai_salary_unittext?.toLowerCase() || "year"
    
    if (job.ai_salary_minvalue && job.ai_salary_maxvalue) {
      return `${currency} ${formatNumber(job.ai_salary_minvalue)} - ${formatNumber(job.ai_salary_maxvalue)} / ${unit}`
    } else if (job.ai_salary_value) {
      return `${currency} ${formatNumber(job.ai_salary_value)} / ${unit}`
    }
  }
  
  // Try raw salary
  if (job.salary_raw) {
    const { currency, minValue, maxValue, value, unitText } = job.salary_raw
    const unit = unitText?.toLowerCase() || "year"
    
    if (minValue && maxValue) {
      return `${currency || ""} ${formatNumber(minValue)} - ${formatNumber(maxValue)} / ${unit}`
    } else if (value) {
      return `${currency || ""} ${formatNumber(value)} / ${unit}`
    }
  }
  
  return null
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`
  }
  return num.toString()
}

