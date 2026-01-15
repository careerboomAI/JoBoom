import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { UserProfile } from "@/types/user-profile"
import { extractProfileForSearch } from "@/types/user-profile"
import type { 
  GeneratedIndeedSearchQuery,
  CreateIndeedSearchQueryOutput,
} from "@/types/indeed_job_search"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/create-search-query/indeed
 * 
 * Uses AI to generate optimized Indeed search queries based on:
 * - User's search query
 * - User's profile data (CV + LinkedIn if available)
 * 
 * AI generates: search_terms, country, location, posted_since
 * FIXED (not asked to AI): max_results = 30
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

    console.log("📝 Generating Indeed search queries for:", query)

    // Extract simplified profile for AI
    const profileSummary = userProfile 
      ? extractProfileForSearch(userProfile as UserProfile)
      : null

    if (profileSummary) {
      console.log("👤 Using profile data for Indeed query optimization")
    }

    // Generate search queries using AI
    const generatedQuery = await generateSearchQueries(query, profileSummary)

    console.log("🤖 AI Generated Indeed Query:", JSON.stringify(generatedQuery, null, 2))

    const response: CreateIndeedSearchQueryOutput = {
      success: true,
      generatedQuery,
      originalQuery: query,
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Indeed Query Generation Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to generate Indeed search queries",
        generatedQuery: null,
        originalQuery: ""
      },
      { status: 500 }
    )
  }
}

/**
 * Generate optimized Indeed search queries using OpenAI
 */
async function generateSearchQueries(
  userQuery: string,
  profileSummary: any
): Promise<GeneratedIndeedSearchQuery> {
  
  const systemPrompt = `You are an expert job search assistant that creates optimized search queries for Indeed.

Your task is to analyze the user's search query and their profile (if provided) to generate search parameters for Indeed job search.

## Parameters YOU must provide:

### search_terms (array of strings, required)
Job titles or skills to search for. Output **2-3 search terms maximum**.
Examples: ["Software Engineer", "Python Developer"], ["Marketing Manager"], ["Data Analyst", "Business Intelligence"]

### country (string, required)
The country to search in. Must be one of the supported countries.
Common options: "United States", "United Kingdom", "Canada", "Australia", "Germany", "Netherlands", "United Arab Emirates", "India", "Singapore"
If the user mentions a city, infer the country. If no location mentioned, default to "United States".

### location (string, optional)
City or region within the country. Leave empty for nationwide search.
Examples: "New York", "London", "Dubai", "San Francisco Bay Area"

### posted_since (string, required)
Time filter for job postings.
Options: "1 day", "3 days", "7 days", "14 days", "1 month", "3 months"
Default to "7 days" unless user specifies otherwise.
If user says "recent" or "new" → "3 days"
If user says "last week" → "7 days"
If user says "last month" → "1 month"

## Guidelines

1. Extract job titles and skills from the user's query and profile.
2. Infer the country from location mentions (e.g., "Dubai" → "United Arab Emirates", "London" → "United Kingdom")
3. Keep search_terms focused - 2-3 terms maximum for better results.
4. Use profile data to add relevant job titles if user asks broadly (e.g., "find me a job")

## Response Format

Return a JSON object with this exact structure:
{
  "description": "Brief description of this search",
  "search_terms": ["term1", "term2"],
  "country": "Country Name",
  "location": "City or empty string",
  "posted_since": "7 days",
  "relevanceScore": 8,
  "reasoning": "Why these parameters were chosen"
}`

  const userPrompt = profileSummary
    ? `User Query: "${userQuery}"

User Profile Summary:
${JSON.stringify(profileSummary, null, 2)}

Generate Indeed search parameters based on the query and profile.`
    : `User Query: "${userQuery}"

No user profile available. Generate Indeed search parameters based on the query alone.`

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
  
  // Validate and clean the response
  let searchTerms: string[] = parsed.search_terms || []
  if (searchTerms.length === 0) {
    searchTerms = userQuery.split(/\s+/).filter(w => w.length > 2).slice(0, 3)
  }
  searchTerms = [...new Set(searchTerms.map(t => t.trim()).filter(t => t.length > 0))].slice(0, 3)

  // Validate country
  const country = parsed.country || "United States"
  
  // Validate posted_since
  const validPostedSince = ["1 day", "3 days", "7 days", "14 days", "1 month", "3 months", "1 year"]
  const postedSince = validPostedSince.includes(parsed.posted_since) ? parsed.posted_since : "7 days"

  return {
    description: parsed.description || `Search for ${searchTerms.join(", ")} jobs`,
    search_terms: searchTerms,
    country,
    location: parsed.location || "",
    posted_since: postedSince,
    relevanceScore: parsed.relevanceScore || 7,
    reasoning: parsed.reasoning || "Generated from user query and profile",
  }
}

