import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { UserProfile } from "@/types/user-profile"
import { extractProfileForSearch } from "@/types/user-profile"
import type { 
  GeneratedBehanceSearchQuery,
  CreateBehanceSearchQueryOutput 
} from "@/types/behance_job_search"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/create-search-query/behance
 * 
 * Uses AI to generate optimized Behance search keyword based on:
 * - User's search query
 * - User's profile data (CV + LinkedIn if available)
 * 
 * AI generates: keyword only
 * FIXED (not asked to AI): maxitems = 30
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

    console.log("📝 Generating Behance search query for:", query)

    // Extract simplified profile for AI
    const profileSummary = userProfile 
      ? extractProfileForSearch(userProfile as UserProfile)
      : null

    if (profileSummary) {
      console.log("👤 Using profile data for Behance query optimization")
    }

    // Generate search keyword using AI
    const generatedQuery = await generateSearchQuery(query, profileSummary)

    console.log("🤖 AI Generated Behance Query:", JSON.stringify(generatedQuery, null, 2))

    const response: CreateBehanceSearchQueryOutput = {
      success: true,
      generatedQuery,
      originalQuery: query,
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Behance Query Generation Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to generate Behance search query",
        generatedQuery: null,
        originalQuery: ""
      },
      { status: 500 }
    )
  }
}

/**
 * Generate optimized Behance search keyword using OpenAI
 */
async function generateSearchQuery(
  userQuery: string,
  profileSummary: any
): Promise<GeneratedBehanceSearchQuery> {
  
  const systemPrompt = `You are an expert job search assistant that creates optimized search keywords for Behance Jobs.

Behance is a platform focused on CREATIVE jobs and roles. It's ideal for:
- Graphic designers
- UI/UX designers  
- Illustrators
- Motion designers
- Art directors
- Brand designers
- Web designers
- Video editors
- 3D artists
- Animators
- Photographers
- Creative directors

## Your Task

Generate a single, focused search keyword or phrase for Behance Jobs based on the user's query and profile.

## Guidelines

1. Keep the keyword concise - 1-3 words maximum
2. Focus on creative/design job titles
3. Use common Behance job title formats (e.g., "graphic designer", "UI designer", "motion designer")
4. If the user's query is not creative-related, try to find the closest creative equivalent
5. If the user has a creative background, leverage their skills

## Examples

User Query: "I want a design job" → keyword: "graphic designer"
User Query: "Looking for UX work" → keyword: "UX designer"
User Query: "Video editing jobs" → keyword: "video editor"
User Query: "I'm a frontend developer" → keyword: "web designer" (closest creative match)
User Query: "Animation work" → keyword: "motion designer"

## Response Format

Return a JSON object with this exact structure:
{
  "description": "Brief description of this search",
  "keyword": "the search keyword",
  "relevanceScore": 8,
  "reasoning": "Why this keyword was chosen"
}`

  const userPrompt = profileSummary
    ? `User Query: "${userQuery}"

User Profile Summary:
${JSON.stringify(profileSummary, null, 2)}

Generate the best Behance search keyword based on the query and profile. Focus on creative/design roles.`
    : `User Query: "${userQuery}"

No user profile available. Generate the best Behance search keyword based on the query alone. Focus on creative/design roles.`

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
  
  // Validate and clean the keyword
  let keyword = parsed.keyword || userQuery
  // Keep it concise
  keyword = keyword.trim().toLowerCase()
  
  // Default to "graphic designer" if empty
  if (!keyword) {
    keyword = "graphic designer"
  }

  return {
    description: parsed.description || `Search for ${keyword} jobs on Behance`,
    keyword,
    relevanceScore: parsed.relevanceScore || 7,
    reasoning: parsed.reasoning || "Generated from user query and profile",
  }
}

