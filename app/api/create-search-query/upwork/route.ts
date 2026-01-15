import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { UserProfile } from "@/types/user-profile"
import { extractProfileForSearch } from "@/types/user-profile"
import type { 
  UpworkJobSearchParams, 
  GeneratedUpworkSearchQuery,
  CreateUpworkSearchQueryOutput 
} from "@/types/upwork_job_search"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Number of queries to generate (configurable)
const NUM_QUERIES_TO_GENERATE = 1

/**
 * POST /api/create-search-query/upwork
 * 
 * Uses AI to generate optimized Upwork job search queries based on:
 * - User's search query (e.g., "React developer remote $50/hr")
 * - User's profile data (CV + LinkedIn if available)
 */
export async function POST(request: NextRequest) {
  try {
    const { query, userProfile } = await request.json()

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      )
    }

    console.log("📝 Generating Upwork search queries for:", query)

    // Extract simplified profile for AI
    const profileSummary = userProfile 
      ? extractProfileForSearch(userProfile as UserProfile)
      : null

    if (profileSummary) {
      console.log("👤 Using profile data for query optimization")
    }

    // Generate search queries using AI
    const queries = await generateSearchQueries(query, profileSummary)

    console.log(`✅ Generated ${queries.length} Upwork search queries`)
    console.log("📊 Queries:", JSON.stringify(queries, null, 2))

    const response: CreateUpworkSearchQueryOutput = {
      success: true,
      queries,
      originalQuery: query,
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Upwork Query Generation Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to generate Upwork search queries",
        queries: [],
        originalQuery: ""
      },
      { status: 500 }
    )
  }
}

/**
 * Generate optimized Upwork search queries using OpenAI
 */
async function generateSearchQueries(
  userQuery: string,
  profileSummary: any
): Promise<GeneratedUpworkSearchQuery[]> {
  
  const systemPrompt = `You are an expert job search assistant that creates optimized Upwork job search queries.

Your task is to analyze the user's search query and their profile (if provided) to generate ${NUM_QUERIES_TO_GENERATE} targeted job search queries for the Upwork Job Search API.

## Upwork Job Search API Parameters YOU CAN USE

### keywords (string, required)
Search term for finding jobs.
CRITICAL REQUIREMENT -> USE TERMS FROM USER PROFILE:
- Output **ONE string** containing **10-18 distinct keywords** separated by spaces (NOT commas).
- Include a mix of: job roles + tools/technologies + domain terms.
- If a profile is provided, you MUST pull extra keywords from it (titles, industries, certifications, education).
- Avoid generic filler like: "job", "freelance", "remote" unless explicitly requested.
Examples:
- "Technical Support Engineer Monitoring Engineer SRE Observability Prometheus Grafana Payments FinTech API Troubleshooting Incident Management"
- "Data Analyst Python Pandas SQL Machine Learning Statistics Risk Management Finance ETL Dashboards"

### experience_level (array, optional)
Filter by required experience. Options:
- "entry_level": Entry level positions
- "intermediate": Mid-level positions  
- "expert": Senior/expert positions
Choose based on user's experience level from their profile or query hints.

### budget (object, optional)
Filter by job budget. Only include if user mentions specific rates:
- hourly: boolean - Include hourly jobs
- min_budget_hourly: number - Minimum $/hour
- max_budget_hourly: number - Maximum $/hour
- fixed_price: boolean - Include fixed-price jobs
- min_budget_fixed_price: number - Minimum project budget
- max_budget_fixed_price: number - Maximum project budget

### numbers_of_proposals (array, optional)
Filter by competition level. Options:
- "less_than_5": Low competition (best for getting hired quickly)
- "5_to_10": Moderate competition
- "10_to_15": Higher competition
- "15_to_20": High competition
- "20_to_50": Very high competition

### project_length (array, optional)
Expected project duration. Options:
- "less_than_1_month": Short projects
- "1_to_3_months": Medium projects
- "3_to_6_months": Long projects
- "more_than_6_months": Very long projects

### hours_per_week (array, optional)
Time commitment. Options:
- "less_than_30": Part-time
- "more_than_30": Full-time

### contract_to_hire_role (boolean, optional)
Set to true only if user specifically wants long-term employment potential.

## Guidelines

1. Build keywords by combining:
   - (a) the user's query intent (role + constraints like 1 month)
   - (b) profile-derived skills and domain terms (certifications, industry, role titles, education)
   The keyword string must be rich enough for Upwork search discovery.

2. If user mentions rates like "$50/hr" or "at least $40", set appropriate budget filters.

3. Match experience_level to user's profile experience if available:
   - 0-2 years → entry_level
   - 2-5 years → intermediate
   - 5+ years → expert

4. Only include filters that are explicitly mentioned or clearly implied by the query/profile.

## Response Format

Return a JSON object with this exact structure:
{
  "queries": [
    {
      "description": "Human-readable description of this search",
      "params": {
        "keywords": "extracted search terms"
        // ... only include other params if needed
      },
      "relevanceScore": 8,
      "reasoning": "Why this query was created"
    }
  ]
}

Only include params that are relevant. Don't include empty arrays or unnecessary filters.`

  const userPrompt = profileSummary
    ? `User Query: "${userQuery}"

User Profile Summary:
${JSON.stringify(profileSummary, null, 2)}

Generate ${NUM_QUERIES_TO_GENERATE} optimized Upwork search query based on the query and profile.`
    : `User Query: "${userQuery}"

No user profile available. Generate ${NUM_QUERIES_TO_GENERATE} optimized Upwork search query based on the query alone.`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error("No response from AI")
  }

  const parsed = JSON.parse(content)
  const queries: GeneratedUpworkSearchQuery[] = parsed.queries || []

  // Log what the AI actually generated (before normalization)
  console.log("🤖 AI Raw Output (before fixed fields):", JSON.stringify(parsed.queries?.map((q: any) => q.params), null, 2))

  // Normalize and validate each query's params
  return queries.map(q => {
    const augmented = {
      ...q,
      params: {
        ...q.params,
        keywords: augmentKeywords(userQuery, profileSummary, q.params?.keywords),
      },
    }

    if (augmented.params.keywords !== q.params?.keywords) {
      console.log("🧩 Upwork keywords augmented:", {
        before: q.params?.keywords,
        after: augmented.params.keywords,
      })
    }

    return {
      ...augmented,
      params: normalizeParams(augmented.params),
    }
  })
}

function augmentKeywords(
  userQuery: string,
  profileSummary: any,
  aiKeywords: unknown
): string {
  const raw = typeof aiKeywords === "string" ? aiKeywords : ""

  const tokenize = (s: string): string[] =>
    s
      .replace(/[,/|]+/g, " ")
      .split(/\s+/g)
      .map(t => t.trim())
      .filter(Boolean)

  const stop = new Set([
    "a","an","and","or","the","to","for","with","my","me","find","job","jobs","work","role","position",
    "month","months","less","than","more","need","looking","search","freelance","freelancer"
  ])

  const normalizeToken = (t: string) => t.replace(/[^\p{L}\p{N}\-+.#]/gu, "")

  const addTokens = (arr: string[], out: Set<string>) => {
    for (const t0 of arr) {
      const t = normalizeToken(t0)
      if (!t) continue
      const low = t.toLowerCase()
      if (stop.has(low)) continue
      if (low.length < 3) continue
      out.add(t)
    }
  }

  const out = new Set<string>()
  addTokens(tokenize(raw), out)
  addTokens(tokenize(userQuery), out)

  // Pull from profile summary (best-effort)
  if (profileSummary) {
    const titles: string[] = Array.isArray(profileSummary.workExperience)
      ? profileSummary.workExperience.map((w: any) => w?.title).filter(Boolean)
      : []
    const companies: string[] = Array.isArray(profileSummary.workExperience)
      ? profileSummary.workExperience.map((w: any) => w?.company).filter(Boolean)
      : []
    const certs: string[] = Array.isArray(profileSummary.certifications)
      ? profileSummary.certifications.filter(Boolean)
      : []
    const edu: string[] = Array.isArray(profileSummary.education)
      ? profileSummary.education.flatMap((e: any) => [e?.degree, e?.fieldOfStudy]).filter(Boolean)
      : []
    const industry: string[] = profileSummary.industry ? [profileSummary.industry] : []

    addTokens(tokenize(titles.join(" ")), out)
    addTokens(tokenize(companies.join(" ")), out)
    addTokens(tokenize(certs.join(" ")), out)
    addTokens(tokenize(edu.join(" ")), out)
    addTokens(tokenize(industry.join(" ")), out)
  }

  // Small inference map (adds useful discovery terms)
  const joined = Array.from(out).join(" ").toLowerCase()
  const inferred: string[] = []
  if (joined.includes("adyen")) inferred.push("Payments", "FinTech")
  if (joined.includes("monitoring")) inferred.push("Observability", "SRE")
  if (joined.includes("data") && joined.includes("science")) inferred.push("Python", "MachineLearning")
  if (joined.includes("smart") && joined.includes("contract")) inferred.push("Solidity", "Blockchain", "Web3")
  addTokens(inferred, out)

  // Prefer multi-word roles by keeping their parts; Upwork keyword string is whitespace-based.
  const finalList = Array.from(out).slice(0, 18)
  return finalList.join(" ")
}

/**
 * Normalizes and validates Upwork search parameters
 * Some fields are FIXED and cannot be changed by AI
 */
function normalizeParams(params: any): UpworkJobSearchParams {
  const normalized: UpworkJobSearchParams = {
    // FIXED FIELDS - These are always set to these values regardless of AI output
    limit: 50,                              // Always 50 results
    sortby: "relevance",                    // Always sort by relevance
    client_payment_verified: true,          // Always require verified payment
    client_history: ["1_to_9_hires", "10_plus_hires"], // Always prefer experienced clients
    // Note: offset is never sent
  }

  // Required: keywords (from AI or augmenter)
  if (params.keywords && typeof params.keywords === "string") {
    normalized.keywords = params.keywords.trim()
  }

  // Optional: experience_level (from AI)
  const validExperience = ["entry_level", "intermediate", "expert"]
  if (Array.isArray(params.experience_level)) {
    const filtered = params.experience_level.filter((e: string) => 
      validExperience.includes(e)
    )
    if (filtered.length > 0) {
      normalized.experience_level = filtered
    }
  }

  // Optional: budget (from AI)
  if (params.budget && typeof params.budget === "object") {
    const budget: UpworkJobSearchParams["budget"] = {}
    
    if (params.budget.hourly === true) {
      budget.hourly = true
      if (typeof params.budget.min_budget_hourly === "number") {
        budget.min_budget_hourly = params.budget.min_budget_hourly
      }
      if (typeof params.budget.max_budget_hourly === "number") {
        budget.max_budget_hourly = params.budget.max_budget_hourly
      }
    }
    
    if (params.budget.fixed_price === true) {
      budget.fixed_price = true
      if (typeof params.budget.min_budget_fixed_price === "number") {
        budget.min_budget_fixed_price = params.budget.min_budget_fixed_price
      }
      if (typeof params.budget.max_budget_fixed_price === "number") {
        budget.max_budget_fixed_price = params.budget.max_budget_fixed_price
      }
    }
    
    if (Object.keys(budget).length > 0) {
      normalized.budget = budget
    }
  }

  // Optional: numbers_of_proposals (from AI)
  const validProposals = ["less_than_5", "5_to_10", "10_to_15", "15_to_20", "20_to_50"]
  if (Array.isArray(params.numbers_of_proposals)) {
    const filtered = params.numbers_of_proposals.filter((p: string) => 
      validProposals.includes(p)
    )
    if (filtered.length > 0) {
      normalized.numbers_of_proposals = filtered
    }
  }

  // Optional: project_length (from AI)
  const validProjectLength = ["less_than_1_month", "1_to_3_months", "3_to_6_months", "more_than_6_months"]
  if (Array.isArray(params.project_length)) {
    const filtered = params.project_length.filter((l: string) => 
      validProjectLength.includes(l)
    )
    if (filtered.length > 0) {
      normalized.project_length = filtered
    }
  }

  // Optional: hours_per_week (from AI)
  const validHours = ["less_than_30", "more_than_30"]
  if (Array.isArray(params.hours_per_week)) {
    const filtered = params.hours_per_week.filter((h: string) => 
      validHours.includes(h)
    )
    if (filtered.length > 0) {
      normalized.hours_per_week = filtered
    }
  }

  // Optional: contract_to_hire_role (from AI)
  if (typeof params.contract_to_hire_role === "boolean") {
    normalized.contract_to_hire_role = params.contract_to_hire_role
  }

  return normalized
}

