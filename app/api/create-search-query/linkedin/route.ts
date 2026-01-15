import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { 
  CreateLinkedInSearchQueryInput, 
  CreateLinkedInSearchQueryOutput,
  GeneratedSearchQuery,
  LinkedInJobSearchParams 
} from "@/types/linkedin_job_search"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ============================================
// CONFIGURABLE PARAMETERS
// ============================================
/** Number of search queries to generate (1-4) */
const NUM_QUERIES_TO_GENERATE = 1

/**
 * POST /api/create-search-query/linkedin
 * 
 * Takes user profile (CV + LinkedIn) and search query,
 * uses ChatGPT to generate optimized LinkedIn job search queries
 */
export async function POST(request: NextRequest) {
  try {
    const input: CreateLinkedInSearchQueryInput = await request.json()

    if (!input.query || !input.query.trim()) {
      return NextResponse.json(
        { success: false, error: "Search query is required", queries: [], originalQuery: "" },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY not configured", queries: [], originalQuery: input.query },
        { status: 500 }
      )
    }

    // Build profile summary for the prompt
    const profileSummary = buildProfileSummary(input.userProfile)
    
    console.log("📝 Generating LinkedIn search queries for:", input.query)
    if (profileSummary) {
      console.log("👤 User Profile Summary:", profileSummary)
    }

    // Generate search queries using ChatGPT
    const queries = await generateSearchQueries(input.query, profileSummary)

    console.log("✅ Generated", queries.length, "search queries")
    console.log("📊 Queries:", JSON.stringify(queries, null, 2))

    const response: CreateLinkedInSearchQueryOutput = {
      success: true,
      queries,
      profileSummary: profileSummary || undefined,
      originalQuery: input.query,
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Create Search Query Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to generate search queries", 
        queries: [],
        originalQuery: ""
      },
      { status: 500 }
    )
  }
}

/**
 * Builds a text summary of the user's profile for the prompt
 */
function buildProfileSummary(profile?: CreateLinkedInSearchQueryInput["userProfile"]): string | null {
  if (!profile) return null

  const parts: string[] = []

  if (profile.headline) {
    parts.push(`Current Role: ${profile.headline}`)
  }

  if (profile.summary) {
    parts.push(`Summary: ${profile.summary.substring(0, 500)}`)
  }

  if (profile.skills && profile.skills.length > 0) {
    parts.push(`Skills: ${profile.skills.slice(0, 15).join(", ")}`)
  }

  if (profile.workExperience && profile.workExperience.length > 0) {
    const recentJobs = profile.workExperience.slice(0, 3)
    const jobsText = recentJobs.map(j => `${j.title} at ${j.company}`).join("; ")
    parts.push(`Recent Experience: ${jobsText}`)
  }

  if (profile.education && profile.education.length > 0) {
    const edu = profile.education[0]
    parts.push(`Education: ${edu.degree || ""} ${edu.fieldOfStudy || ""} from ${edu.institution}`.trim())
  }

  if (profile.location) {
    parts.push(`Location: ${profile.location}`)
  }

  if (profile.industry) {
    parts.push(`Industry: ${profile.industry}`)
  }

  if (profile.certifications && profile.certifications.length > 0) {
    parts.push(`Certifications: ${profile.certifications.slice(0, 5).join(", ")}`)
  }

  if (profile.languages && profile.languages.length > 0) {
    parts.push(`Languages: ${profile.languages.join(", ")}`)
  }

  return parts.length > 0 ? parts.join("\n") : null
}

/**
 * Uses ChatGPT to generate LinkedIn job search queries
 */
async function generateSearchQueries(
  userQuery: string, 
  profileSummary: string | null
): Promise<GeneratedSearchQuery[]> {
  
  const systemPrompt = `You are an expert job search assistant that creates optimized LinkedIn job search queries.

Your task is to analyze the user's search query and their profile (if provided) to generate targeted job search queries for the LinkedIn Job Search API.

## LinkedIn Job Search API Parameters YOU CAN USE

### Time Range
- timeRange: "1h" | "24h" | "7d"
  - "1h" = Jobs indexed in the last hour (includes recently reposted jobs)
  - "24h" = Jobs indexed in the last 24 hours
  - "7d" = Jobs posted in the last 7 days (DEFAULT if not specified)

### Search Parameters (arrays of strings)
Use :* suffix for prefix matching (e.g., "Soft:*" matches "Software", "Softball")

- titleSearch: Array of job titles to search for in job titles
  Example: ["Software Engineer", "Developer", "SWE"]
  
- titleExclusionSearch: Array of terms to EXCLUDE from job titles
  Example: ["Senior", "Lead"] to find junior roles
  
- locationSearch: Array of locations to search. USE FULL NAMES, NOT ABBREVIATIONS
  Example: ["New York", "United States"] NOT ["NY", "US"]
  
- locationExclusionSearch: Array of locations to exclude
  Example: ["California"] to exclude CA jobs
  
- descriptionSearch: Array of terms to search in job descriptions
  WARNING: Very intensive query - use sparingly and combine with titleSearch
  Example: ["Python", "AWS", "Kubernetes"]
  
- descriptionExclusionSearch: Array of terms to exclude from descriptions
  Example: ["clearance required", "US citizens only"]
  
- organizationSearch: Array of company names to search
  Example: ["Google", "Microsoft", "Amazon"]
  
- organizationExclusionSearch: Array of company names to exclude
  Example: ["Accenture", "Infosys"] to exclude consulting firms
  
- organizationDescriptionSearch: Search terms in company descriptions/about pages
  VERY USEFUL for finding companies in specific industries or with specific tech stacks
  Example: ["blockchain", "fintech", "AI startup"]
  
- organizationDescriptionExclusionSearch: Exclude companies with these in their description
  Example: ["gambling", "adult"]

### Filters

- remote: boolean
  Set to true to ONLY show remote jobs. Leave undefined to show all jobs.
  
- seniorityFilter: Array of seniority levels
  Options: ["Associate", "Director", "Executive", "Mid-Senior level", "Entry level", "Not Applicable", "Internship"]
  Example: ["Entry level", "Associate"] for junior roles
  
- EmploymentTypeFilter: Array of employment types
  Options: ["FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "INTERN", "VOLUNTEER", "PER_DIEM", "OTHER"]
  Example: ["FULL_TIME", "CONTRACTOR"]
  
- industryFilter: Array of LinkedIn industry names (must be exact names)
  Examples: "Information Technology & Services", "Computer Software", "Financial Services", "Healthcare"
  
- organizationEmployeesLte: Maximum company size (number of employees)
  Example: 500 to find startups/SMBs
  
- organizationEmployeesGte: Minimum company size
  Example: 1000 to find larger companies
  
- externalApplyUrl: boolean
  Set true to find jobs with external application links (not Easy Apply)
  
- directApply: boolean  
  Set true to find LinkedIn Easy Apply jobs only

- limit: Number of results (10-100)
  Default: 50. Use higher for broader searches.

### AI-Enhanced Filters (BETA - very useful!)

- aiWorkArrangementFilter: Array of work arrangements
  Options: ["On-site", "Hybrid", "Remote OK", "Remote Solely"]
  - "Remote OK" = Remote with optional office
  - "Remote Solely" = Fully remote, no office
  Example: ["Remote OK", "Remote Solely"] for all remote jobs
  
- aiExperienceLevelFilter: Array of experience levels (years)
  Options: ["0-2", "2-5", "5-10", "10+"]
  Example: ["0-2", "2-5"] for early career roles
  
- aiVisaSponsorshipFilter: boolean
  Set true to find jobs offering visa sponsorship
  
- aiHasSalary: boolean
  Set true to only return jobs with salary information
  
- aiTaxonomiesFilter: Array of job categories
  Options: "Technology", "Healthcare", "Management & Leadership", "Finance & Accounting", 
  "Human Resources", "Sales", "Marketing", "Customer Service & Support", "Education", 
  "Legal", "Engineering", "Science & Research", "Trades", "Construction", "Manufacturing", 
  "Logistics", "Creative & Media", "Hospitality", "Retail", "Data & Analytics", "Software", 
  "Energy", "Agriculture", "Social Services", "Administrative", "Government & Public Sector", 
  "Art & Design", "Food & Beverage", "Transportation", "Consulting", "Sports & Recreation", "Security & Safety"

## Guidelines

1. Parse time references from user query:
   - "last 7 days", "this week", "recent" → timeRange: "7d"
   - "last 24 hours", "today", "just now" → timeRange: "24h"
   - "last hour", "just posted" → timeRange: "1h"
   - If no time mentioned, use "7d" as default

2. Extract job titles and create smart variations:
   - "Software Engineer" → also try "Developer", "SWE", "Software Developer"
   - "Data Scientist" → also try "Data Analyst", "ML Engineer"
   - "Product Manager" → also try "PM", "Product Owner"

3. For remote work requests:
   - If user says "remote" → use aiWorkArrangementFilter: ["Remote OK", "Remote Solely"]
   - If user says "hybrid" → use aiWorkArrangementFilter: ["Hybrid"]
   - If user says "on-site" or "office" → use aiWorkArrangementFilter: ["On-site"]

4. Use organizationDescriptionSearch strategically:
   - If user has specific industry experience (crypto, fintech, healthcare), use it to find relevant companies
   - If profile shows specific tech stack, find companies using similar tech

5. Create diverse queries:
   - Query 1: Most literal interpretation of user's request
   - Query 2: Broader job title variations
   - Query 3: Based on user's skills/background (if profile provided)
   - Query 4 (optional): Alternative industry or adjacent roles

6. Set appropriate seniority based on experience:
   - 0-2 years → ["Entry level", "Associate", "Internship"]
   - 2-5 years → ["Associate", "Mid-Senior level"]
   - 5-10 years → ["Mid-Senior level", "Director"]
   - 10+ years → ["Director", "Executive"]

## Response Format

Return a JSON object with this exact structure:
{
  "queries": [
    {
      "description": "Human-readable description of this search",
      "params": { /* Only include fields you want to set */ },
      "relevanceScore": 8,
      "reasoning": "Why this query was created"
    }
  ]
}

Each query should have different focus to maximize job coverage while maintaining relevance.`

  const userPrompt = `Generate LinkedIn job search queries for the following:

## User's Search Query
"${userQuery}"

${profileSummary ? `## User's Profile
${profileSummary}` : "## No profile data provided"}

Please generate exactly ${NUM_QUERIES_TO_GENERATE} optimized search ${NUM_QUERIES_TO_GENERATE === 1 ? 'query' : 'queries'}. Consider:
1. The explicit requirements in the user's query (job title, location, time range, etc.)
2. The user's background and skills (if profile provided)
3. Related job titles and synonyms
4. Industry alignment based on their experience

Return ONLY valid JSON matching the specified format.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error("No response from OpenAI")
  }

  const parsed = JSON.parse(content)
  
  // Validate and normalize the response
  if (!parsed.queries || !Array.isArray(parsed.queries)) {
    throw new Error("Invalid response format: missing queries array")
  }

  // Ensure each query has required fields and defaults
  const validatedQueries: GeneratedSearchQuery[] = parsed.queries.map((q: any, index: number) => ({
    description: q.description || `Search Query ${index + 1}`,
    params: normalizeParams(q.params || {}),
    relevanceScore: typeof q.relevanceScore === "number" ? q.relevanceScore : 5,
    reasoning: q.reasoning || "No reasoning provided"
  }))

  return validatedQueries
}

/**
 * Normalizes and validates search parameters
 * Some fields are FIXED and cannot be changed by AI
 */
function normalizeParams(params: any): LinkedInJobSearchParams {
  // Start fresh - don't copy any fixed fields from AI output
  const normalized: LinkedInJobSearchParams = {
    // Dynamic defaults only
    limit: Math.min(Math.max(params.limit || 50, 10), 100), // Clamp between 10-100
  }
  
  // FIXED FIELDS - These will be added at the end and OVERRIDE any AI output
  // They are NOT included here so AI-generated values get filtered out

  // Time range (default to 7d if not specified)
  if (params.timeRange && ["1h", "24h", "7d"].includes(params.timeRange)) {
    normalized.timeRange = params.timeRange
  } else {
    normalized.timeRange = "7d"
  }

  // Search arrays - ensure they are arrays of strings
  // Note: organizationSlugFilter, organizationSlugExclusionFilter are excluded (internal use only)
  const arrayFields = [
    "titleSearch", "titleExclusionSearch",
    "locationSearch", "locationExclusionSearch",
    "descriptionSearch", "descriptionExclusionSearch",
    "organizationSearch", "organizationExclusionSearch",
    "organizationDescriptionSearch", "organizationDescriptionExclusionSearch",
    "seniorityFilter", "EmploymentTypeFilter",
    "industryFilter",
    "aiWorkArrangementFilter", "aiExperienceLevelFilter",
    "aiTaxonomiesFilter", "aiTaxonomiesPrimaryFilter", "aiTaxonomiesExclusionFilter"
  ]

  for (const field of arrayFields) {
    if (params[field] && Array.isArray(params[field]) && params[field].length > 0) {
      (normalized as any)[field] = params[field].filter((v: any) => typeof v === "string" && v.trim())
    }
  }

  // Boolean fields
  if (typeof params.remote === "boolean") normalized.remote = params.remote
  if (typeof params.directApply === "boolean") normalized.directApply = params.directApply
  if (typeof params.externalApplyUrl === "boolean") normalized.externalApplyUrl = params.externalApplyUrl
  if (typeof params.aiHasSalary === "boolean") normalized.aiHasSalary = params.aiHasSalary
  if (typeof params.aiVisaSponsorshipFilter === "boolean") normalized.aiVisaSponsorshipFilter = params.aiVisaSponsorshipFilter

  // Number fields
  if (typeof params.organizationEmployeesLte === "number") normalized.organizationEmployeesLte = params.organizationEmployeesLte
  if (typeof params.organizationEmployeesGte === "number") normalized.organizationEmployeesGte = params.organizationEmployeesGte

  // ============================================
  // FIXED FIELDS - Always override AI output
  // These are set here at the end to ensure they cannot be changed
  // ============================================
  normalized.includeAi = false        // We handle AI enrichment ourselves
  normalized.descriptionType = "text" // Always get text descriptions
  normalized.removeAgency = false     // Include all jobs including from agencies
  // Note: organizationSlugFilter, organizationSlugExclusionFilter, excludeATSDuplicate are never included

  return normalized
}

