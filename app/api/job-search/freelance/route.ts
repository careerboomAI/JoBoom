import { NextRequest, NextResponse } from "next/server"
import { ApifyClient } from "apify-client"
import type { 
  FreelanceJobSearchParams, 
  FreelanceJobResult,
  CreateFreelanceSearchQueryOutput,
  FreelanceJobCardData 
} from "@/types/freelance_job_search"
import { transformFreelanceJob } from "@/types/freelance_job_search"

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

/**
 * Deduplicate jobs by project_id
 * Same job can appear for multiple query terms
 */
function deduplicateJobs(jobs: FreelanceJobResult[]): FreelanceJobResult[] {
  const seen = new Set<number>()
  return jobs.filter(job => {
    if (seen.has(job.project_id)) {
      return false
    }
    seen.add(job.project_id)
    return true
  })
}

// Fixed parameters (AI doesn't control these)
const FIXED_ITEM_LIMIT = 10
const FIXED_PROXY_CONFIG = {
  useApifyProxy: true,
  apifyProxyGroups: ["RESIDENTIAL"]
}

/**
 * POST /api/job-search/freelance
 * 
 * Freelance.com job search endpoint
 * 1. Takes user query and optional profile data
 * 2. Generates optimized search queries using AI (just the query terms)
 * 3. Calls Apify's Freelancer Jobs Scraper
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

    console.log("🔍 Starting Freelance.com job search for:", query)

    // Step 1: Generate optimized search queries using AI
    const searchQueryResponse = await generateSearchQuery(query, userProfile)
    
    if (!searchQueryResponse.success || !searchQueryResponse.generatedQuery) {
      console.error("Failed to generate Freelance search query:", searchQueryResponse.error)
      return NextResponse.json(
        { error: searchQueryResponse.error || "Failed to generate search query" },
        { status: 500 }
      )
    }

    const generatedQuery = searchQueryResponse.generatedQuery
    console.log("🤖 AI Generated Freelance Queries:", generatedQuery.queries)

    // Step 2: Build search params with fixed values
    const searchParams: FreelanceJobSearchParams = {
      queries: generatedQuery.queries,
      item_limit: FIXED_ITEM_LIMIT,
      proxyConfiguration: FIXED_PROXY_CONFIG,
    }

    console.log("📋 Search Params:", JSON.stringify(searchParams, null, 2))

    // Step 3: Call Apify Freelancer Jobs Scraper
    const jobs = await searchFreelanceJobs(searchParams)
    
    console.log(`📥 Raw results: ${jobs.length} Freelance.com jobs`)

    // Step 4: Deduplicate jobs by project_id (same job can match multiple queries)
    const uniqueJobs = deduplicateJobs(jobs)
    console.log(`✅ After dedup: ${uniqueJobs.length} unique jobs`)

    // Step 5: Transform jobs to our frontend format
    const results: FreelanceJobCardData[] = uniqueJobs.map(job => transformFreelanceJob(job))

    return NextResponse.json({
      results,
      totalResults: results.length,
      searchQuery: generatedQuery,
    })

  } catch (error: any) {
    console.error("Freelance Job Search Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to search Freelance.com jobs" },
      { status: 500 }
    )
  }
}

/**
 * Generate optimized search query using our AI endpoint
 */
async function generateSearchQuery(
  query: string, 
  userProfile?: any
): Promise<CreateFreelanceSearchQueryOutput> {
  // Use internal URL for server-to-server calls (never expose to frontend)
  const baseUrl = process.env.INTERNAL_API_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000"
  
  const response = await fetch(`${baseUrl}/api/create-search-query/freelance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, userProfile }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to generate Freelance search query")
  }

  return response.json()
}

/**
 * Call Apify's Freelancer Jobs Scraper
 */
async function searchFreelanceJobs(params: FreelanceJobSearchParams): Promise<FreelanceJobResult[]> {
  const client = new ApifyClient({
    token: APIFY_API_TOKEN,
  })

  console.log("📡 Calling Apify Freelancer Jobs Scraper...")

  // Run the Actor
  const run = await client.actor("getdataforme/freelancer-jobs-scraper").call(params)

  console.log(`💾 Apify Freelance run completed. Dataset ID: ${run.defaultDatasetId}`)

  // Fetch results from the dataset
  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  return items as unknown as FreelanceJobResult[]
}

