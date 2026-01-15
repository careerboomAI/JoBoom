import { NextRequest, NextResponse } from "next/server"
import { ApifyClient } from "apify-client"
import type { 
  BehanceJobResult, 
  BehanceJobSearchParams,
  BehanceJobCardData,
  CreateBehanceSearchQueryOutput 
} from "@/types/behance_job_search"
import { transformBehanceJob } from "@/types/behance_job_search"

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

// Fixed parameter - AI doesn't control this
const FIXED_MAX_ITEMS = 30

// Timeout for Behance actor (in seconds)
const BEHANCE_TIMEOUT_SECONDS = 70

/**
 * Deduplicate jobs by job_id
 */
function deduplicateJobs(jobs: BehanceJobResult[]): BehanceJobResult[] {
  const seen = new Set<number>()
  return jobs.filter(job => {
    if (seen.has(job.job_id)) {
      return false
    }
    seen.add(job.job_id)
    return true
  })
}

/**
 * POST /api/job-search/behance
 * 
 * Searches for jobs on Behance using Apify's behance-jobs-search-scraper.
 * 
 * Flow:
 * 1. Receive user query and optional profile
 * 2. Call /api/create-search-query/behance to get AI-generated keyword
 * 3. Call Apify actor with keyword
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
    console.log("🎨 Behance Job Search")
    console.log("=".repeat(60))
    console.log("📝 Query:", query)

    // Step 1: Generate search keyword using AI
    const createQueryResponse = await fetch(
      new URL("/api/create-search-query/behance", request.url).toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userProfile }),
      }
    )

    const queryResult: CreateBehanceSearchQueryOutput = await createQueryResponse.json()

    if (!queryResult.success || !queryResult.generatedQuery) {
      throw new Error(queryResult.error || "Failed to generate Behance search query")
    }

    const generatedQuery = queryResult.generatedQuery
    console.log("✅ AI Generated Keyword:", generatedQuery.keyword)

    // Step 2: Build search params with fixed maxitems
    const searchParams: BehanceJobSearchParams = {
      keyword: generatedQuery.keyword,
      maxitems: FIXED_MAX_ITEMS,
    }

    console.log("📋 Final Search Params:", JSON.stringify(searchParams, null, 2))

    // Step 3: Call Apify actor
    const jobs = await searchBehanceJobs(searchParams)
    
    console.log(`📥 Raw results: ${jobs.length} Behance jobs`)

    // Step 4: Deduplicate jobs
    const uniqueJobs = deduplicateJobs(jobs)
    console.log(`✅ After dedup: ${uniqueJobs.length} unique jobs`)

    // Step 5: Filter only ACTIVE jobs
    const activeJobs = uniqueJobs.filter(job => job.job_status === "ACTIVE")
    console.log(`✅ Active jobs: ${activeJobs.length}`)

    // Step 6: Transform jobs to our frontend format
    const results: BehanceJobCardData[] = activeJobs.map(job => transformBehanceJob(job))

    return NextResponse.json({
      results,
      totalResults: results.length,
      searchQuery: generatedQuery,
    })

  } catch (error: any) {
    console.error("Behance Job Search Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to search Behance jobs" },
      { status: 500 }
    )
  }
}

/**
 * Call Apify's Behance job search actor with timeout
 */
async function searchBehanceJobs(params: BehanceJobSearchParams): Promise<BehanceJobResult[]> {
  const client = new ApifyClient({
    token: APIFY_API_TOKEN!,
  })

  console.log("🚀 Calling Apify Behance actor...")
  console.log(`⏱️  Timeout set to ${BEHANCE_TIMEOUT_SECONDS} seconds`)

  const input = {
    keyword: params.keyword,
    maxitems: params.maxitems,
  }

  console.log("📨 Actor input:", JSON.stringify(input, null, 2))

  try {
    // Use Promise.race to implement timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("TIMEOUT"))
      }, BEHANCE_TIMEOUT_SECONDS * 1000)
    })

    const actorPromise = client.actor("scrapestorm/behance-jobs-search-scraper-fast-and-cheap").call(input, {
      timeout: BEHANCE_TIMEOUT_SECONDS, // Apify's built-in timeout (in seconds)
    })

    const run = await Promise.race([actorPromise, timeoutPromise])

    console.log(`✅ Apify run completed: ${run.id}`)
    console.log(`💾 Dataset: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`)

    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    return items as unknown as BehanceJobResult[]
  } catch (error: any) {
    if (error.message === "TIMEOUT" || error.message?.includes("timeout")) {
      console.log(`⚠️ Behance search timed out after ${BEHANCE_TIMEOUT_SECONDS}s - returning empty results`)
      return []
    }
    throw error
  }
}

