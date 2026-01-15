import { NextRequest, NextResponse } from "next/server"
import { ApifyClient } from "apify-client"
import type { 
  IndeedJobResult, 
  IndeedJobSearchParams,
  IndeedJobCardData,
  CreateIndeedSearchQueryOutput 
} from "@/types/indeed_job_search"
import { transformIndeedJob } from "@/types/indeed_job_search"

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

// Fixed parameter - AI doesn't control this
const FIXED_MAX_RESULTS = 30

/**
 * Deduplicate jobs by platform_url
 */
function deduplicateJobs(jobs: IndeedJobResult[]): IndeedJobResult[] {
  const seen = new Set<string>()
  return jobs.filter(job => {
    const key = job.platform_url
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * POST /api/job-search/indeed
 * 
 * Searches for jobs on Indeed using Apify's cheapget/indeed-job-search actor.
 * 
 * Flow:
 * 1. Receive user query and optional profile
 * 2. Call /api/create-search-query/indeed to get AI-generated params
 * 3. Call Apify actor with params
 * 4. Transform and return results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, userProfile } = body

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      )
    }

    if (!APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN is not configured" },
        { status: 500 }
      )
    }

    console.log("\n" + "=".repeat(60))
    console.log("🔍 Indeed Job Search")
    console.log("=".repeat(60))
    console.log("📝 Query:", query)

    // Step 1: Generate search parameters using AI
    const createQueryResponse = await fetch(
      new URL("/api/create-search-query/indeed", request.url).toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userProfile }),
      }
    )

    const queryResult: CreateIndeedSearchQueryOutput = await createQueryResponse.json()

    if (!queryResult.success || !queryResult.generatedQuery) {
      throw new Error(queryResult.error || "Failed to generate Indeed search query")
    }

    const generatedQuery = queryResult.generatedQuery
    console.log("✅ AI Generated Query:", JSON.stringify(generatedQuery, null, 2))

    // Step 2: Build search params with fixed values
    const searchParams: IndeedJobSearchParams = {
      search_terms: generatedQuery.search_terms,
      country: generatedQuery.country,
      location: generatedQuery.location || "",
      posted_since: generatedQuery.posted_since,
      max_results: FIXED_MAX_RESULTS, // Always fixed at 30
    }

    console.log("📋 Final Search Params:", JSON.stringify(searchParams, null, 2))

    // Step 3: Call Apify actor
    const jobs = await searchIndeedJobs(searchParams)
    
    console.log(`📥 Raw results: ${jobs.length} Indeed jobs`)

    // Step 4: Deduplicate jobs
    const uniqueJobs = deduplicateJobs(jobs)
    console.log(`✅ After dedup: ${uniqueJobs.length} unique jobs`)

    // Step 5: Transform jobs to our frontend format
    const results: IndeedJobCardData[] = uniqueJobs.map(job => transformIndeedJob(job))

    return NextResponse.json({
      results,
      totalResults: results.length,
      searchQuery: generatedQuery,
    })

  } catch (error: any) {
    console.error("Indeed Job Search Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to search Indeed jobs" },
      { status: 500 }
    )
  }
}

/**
 * Call Apify's Indeed job search actor
 */
async function searchIndeedJobs(params: IndeedJobSearchParams): Promise<IndeedJobResult[]> {
  const client = new ApifyClient({
    token: APIFY_API_TOKEN!,
  })

  console.log("🚀 Calling Apify Indeed actor...")

  // Build input for the actor
  const input: Record<string, any> = {
    search_terms: params.search_terms,
    country: params.country,
    posted_since: params.posted_since,
    max_results: params.max_results,
  }

  // Only add location if specified
  if (params.location) {
    input.location = params.location
  }

  console.log("📨 Actor input:", JSON.stringify(input, null, 2))

  const run = await client.actor("cheapget/indeed-job-search").call(input)

  console.log(`✅ Apify run completed: ${run.id}`)
  console.log(`💾 Dataset: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`)

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  return items as unknown as IndeedJobResult[]
}

