import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { UserProfile } from "@/types/user-profile"
import { extractProfileForSearch } from "@/types/user-profile"
import type { 
  GeneratedFreelanceSearchQuery,
  CreateFreelanceSearchQueryOutput 
} from "@/types/freelance_job_search"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/create-search-query/freelance
 * 
 * Uses AI to generate optimized Freelance.com search queries based on:
 * - User's search query
 * - User's profile data (CV + LinkedIn if available)
 * 
 * AI ONLY generates the `queries` array - all other params are fixed.
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

    console.log("📝 Generating Freelance.com search queries for:", query)

    // Extract simplified profile for AI
    const profileSummary = userProfile 
      ? extractProfileForSearch(userProfile as UserProfile)
      : null

    if (profileSummary) {
      console.log("👤 Using profile data for Freelance query optimization")
    }

    // Generate search queries using AI
    const generatedQuery = await generateSearchQueries(query, profileSummary)

    console.log("🤖 AI Raw Output:", JSON.stringify(generatedQuery.queries, null, 2))
    console.log(`✅ Generated ${generatedQuery.queries.length} Freelance search terms`)

    const response: CreateFreelanceSearchQueryOutput = {
      success: true,
      generatedQuery,
      originalQuery: query,
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Freelance Query Generation Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to generate Freelance search queries",
        generatedQuery: null,
        originalQuery: ""
      },
      { status: 500 }
    )
  }
}

/**
 * Generate optimized Freelance.com search queries using OpenAI
 */
async function generateSearchQueries(
  userQuery: string,
  profileSummary: any
): Promise<GeneratedFreelanceSearchQuery> {
  
  const systemPrompt = `You are an expert job search assistant that creates optimized search queries for Freelance.com.

Your task is to analyze the user's search query and their profile (if provided) to generate an array of search terms for the Freelance.com job search.

## Your ONLY Output: queries (array of strings)

You must output an array of **exactly 3 search terms**. Each term should be:
- A skill (e.g., "Python", "React", "WordPress")
- A technology (e.g., "Node.js", "AWS", "PostgreSQL")
- A job role (e.g., "Data Analyst", "Web Developer")

Pick the 3 MOST RELEVANT and MARKETABLE terms based on the query and profile.

## Guidelines

1. Extract skills and technologies from:
   - The user's query
   - Their profile (job titles, certifications, education fields, industry)

2. Each search term should be **1-3 words maximum**.

3. Prioritize terms that are commonly used on freelance platforms.

4. Include variations when helpful (e.g., both "React" and "React.js").

5. Focus on marketable, in-demand skills.

## Examples

User: "Find me Python jobs"
Profile: Has ML certifications, worked at fintech
Output: ["Python", "Machine Learning", "FinTech"]

User: "Web development work"
Profile: React developer, WordPress experience
Output: ["React", "WordPress", "JavaScript"]

## Response Format

Return a JSON object with this exact structure:
{
  "description": "Brief description of what these search terms target",
  "queries": ["term1", "term2", "term3"],
  "relevanceScore": 8,
  "reasoning": "Why these terms were chosen"
}

Output exactly 3 search terms that will find the most relevant jobs.`

  const userPrompt = profileSummary
    ? `User Query: "${userQuery}"

User Profile Summary:
${JSON.stringify(profileSummary, null, 2)}

Generate search terms based on the query and profile.`
    : `User Query: "${userQuery}"

No user profile available. Generate search terms based on the query alone.`

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
  
  // Validate and clean the queries
  let queries: string[] = parsed.queries || []
  
  // Ensure we have at least some queries
  if (queries.length === 0) {
    // Fallback: extract words from user query
    queries = userQuery.split(/\s+/).filter(w => w.length > 2).slice(0, 3)
  }
  
  // Clean and dedupe, limit to 3 queries
  queries = [...new Set(
    queries
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0 && q.length <= 50)
  )].slice(0, 3) // Max 3 queries to avoid too many results

  return {
    description: parsed.description || `Search for: ${queries.join(", ")}`,
    queries,
    relevanceScore: parsed.relevanceScore || 7,
    reasoning: parsed.reasoning || "Generated from user query and profile",
  }
}

