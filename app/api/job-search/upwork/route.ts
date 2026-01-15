import { NextRequest, NextResponse } from "next/server"
import { ApifyClient } from "apify-client"
import type { 
  UpworkJobSearchParams, 
  UpworkJobResult,
  CreateUpworkSearchQueryOutput,
  UpworkJobCardData 
} from "@/types/upwork_job_search"
import { transformUpworkJob } from "@/types/upwork_job_search"

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

/**
 * POST /api/job-search/upwork
 * 
 * Upwork job search endpoint
 * 1. Takes user query and optional profile data
 * 2. Generates optimized search query using AI
 * 3. Calls Apify's Upwork Job Scraper
 * 4. Returns job results
 */
export async function POST(request: NextRequest) {
  try {
    const { query, userProfile } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    if (!APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN not configured" },
        { status: 500 }
      )
    }

    console.log("🔍 Starting Upwork job search for:", query)

    // Step 1: Generate optimized search query using AI
    const searchQueryResponse = await generateSearchQuery(query, userProfile, request.url)
    
    if (!searchQueryResponse.success || searchQueryResponse.queries.length === 0) {
      console.error("Failed to generate Upwork search query:", searchQueryResponse.error)
      return NextResponse.json(
        { error: searchQueryResponse.error || "Failed to generate search query" },
        { status: 500 }
      )
    }

    const generatedQuery = searchQueryResponse.queries[0]
    console.log("🤖 AI Generated Upwork Query:", generatedQuery.description)
    console.log("📋 Search Params:", JSON.stringify(generatedQuery.params, null, 2))

    // Step 2: Call Apify Upwork Job Scraper
    const jobs = await searchUpworkJobs(generatedQuery.params)
    
    console.log(`✅ Found ${jobs.length} Upwork jobs`)

    // Step 3: Transform jobs to our frontend format
    const results: UpworkJobCardData[] = jobs.map(job => transformUpworkJob(job))

    return NextResponse.json({
      results,
      totalResults: results.length,
      searchQuery: generatedQuery,
    })

  } catch (error: any) {
    console.error("Upwork Job Search Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to search Upwork jobs" },
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
): Promise<CreateUpworkSearchQueryOutput> {
  // Use the incoming request URL as base - this works correctly on Vercel
  const fullUrl = new URL("/api/create-search-query/upwork", requestUrl).toString()
  
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, userProfile }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to generate Upwork search query")
  }

  return response.json()
}

/**
 * Fields to progressively remove when search returns 0 results
 * Ordered from most restrictive to least restrictive
 * 
 * Note: Only includes AI-controlled fields. Fixed fields like
 * client_history, client_payment_verified are never removed.
 */
const RELAXABLE_FIELDS = [
  "numbers_of_proposals",  // Competition level filter
  "project_length",        // Duration filter
  "hours_per_week",        // Part-time/full-time filter
  "contract_to_hire_role", // Long-term potential filter
  "experience_level",      // Entry/intermediate/expert filter
  "budget",                // Hourly/fixed price filters (remove last)
] as const

/**
 * Call Apify's Upwork Job Scraper with retry logic
 * If no results are found, progressively removes restrictive fields and retries
 */
async function searchUpworkJobs(params: UpworkJobSearchParams): Promise<UpworkJobResult[]> {
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
    console.log(`✅ Found ${results.length} Upwork jobs on first attempt`)
    return results
  }
  
  console.log("⚠️ No Upwork results found. Starting retry logic with field relaxation...")
  
  // Progressively remove fields and retry
  for (const field of RELAXABLE_FIELDS) {
    // Check if this field exists and has a value in current params
    const fieldValue = (currentParams as any)[field]
    const hasValue = fieldValue !== undefined && fieldValue !== null && 
      (Array.isArray(fieldValue) ? fieldValue.length > 0 : 
       typeof fieldValue === "object" ? Object.keys(fieldValue).length > 0 : true)
    
    if (!hasValue) {
      continue // Skip fields that aren't set
    }
    
    // Remove this field
    const newParams = { ...currentParams }
    delete (newParams as any)[field]
    currentParams = newParams
    removedFields.push(field)
    
    console.log(`🔄 Upwork Retry #${removedFields.length}: Removed "${field}"`)
    
    // Execute search with relaxed params
    results = await executeSearch(client, currentParams)
    
    if (results.length > 0) {
      console.log(`✅ Found ${results.length} Upwork jobs after removing: ${removedFields.join(", ")}`)
      return results
    }
  }
  
  console.log(`❌ No Upwork results found even after removing all relaxable fields: ${removedFields.join(", ")}`)
  return []
}

/**
 * Execute a single search against Apify Upwork Scraper
 */
async function executeSearch(
  client: ApifyClient, 
  params: UpworkJobSearchParams
): Promise<UpworkJobResult[]> {
  console.log("📡 Calling Apify Upwork Job Scraper...")

  // Run the Actor
  const run = await client.actor("fasty_dev/upwork-job-scraper").call(params)

  console.log(`💾 Apify Upwork run completed. Dataset ID: ${run.defaultDatasetId}`)

  // Fetch results from the dataset
  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  return items as unknown as UpworkJobResult[]
}

