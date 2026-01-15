import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { UserProfile } from "@/types/user-profile"
import { extractProfileForSearch } from "@/types/user-profile"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SourceSelection {
  linkedin: boolean
  behance: boolean
  indeed: boolean
  freelance: boolean
  upwork: boolean
  reasoning: string
}

/**
 * POST /api/select-sources
 * 
 * Uses AI to determine which job platforms are most relevant for the user's query and profile.
 * This is used when "Auto" mode is enabled.
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

    console.log("\n" + "=".repeat(60))
    console.log("🤖 AI Source Selection")
    console.log("=".repeat(60))
    console.log("📝 Query:", query)

    // Extract simplified profile for AI
    const profileSummary = userProfile 
      ? extractProfileForSearch(userProfile as UserProfile)
      : null

    if (profileSummary) {
      console.log("👤 Using profile data for source selection")
    }

    // Ask AI which sources to use
    const selection = await selectSources(query, profileSummary)

    console.log("✅ AI Source Selection:", JSON.stringify(selection, null, 2))

    return NextResponse.json({
      success: true,
      selection,
    })

  } catch (error: any) {
    console.error("Source Selection Error:", error)
    // On error, default to all sources
    return NextResponse.json({
      success: true,
      selection: {
        linkedin: true,
        behance: true,
        indeed: true,
        freelance: true,
        upwork: true,
        reasoning: "Default selection due to error",
      },
    })
  }
}

/**
 * Use AI to determine which platforms to search
 */
async function selectSources(
  userQuery: string,
  profileSummary: any
): Promise<SourceSelection> {
  
  const systemPrompt = `You are an expert job search assistant that determines which job platforms are most relevant for a user's job search.

## Available Platforms

1. **LinkedIn** - Best for:
   - Corporate/professional jobs (all levels)
   - Executive positions (CEO, CFO, VP, Director)
   - Full-time employment
   - Enterprise companies
   - Traditional industries (finance, consulting, tech, healthcare, etc.)
   - Management and leadership roles

2. **Indeed** - Best for:
   - Wide variety of jobs (entry-level to senior)
   - Traditional employment (full-time, part-time)
   - Local/regional jobs
   - Hourly positions
   - Blue collar and white collar jobs
   - Healthcare, retail, hospitality, manufacturing

3. **Behance** - Best for:
   - Creative/design roles ONLY
   - Graphic designers, UI/UX designers, illustrators
   - Art directors, motion designers
   - Brand designers, web designers
   - Video editors, 3D artists, animators
   - NOT suitable for non-creative roles

4. **Upwork** - Best for:
   - Freelance/contract work
   - Short-term projects
   - Remote gig work
   - Technical freelancing (development, writing, marketing)
   - NOT suitable for traditional full-time employment
   - NOT suitable for executive/leadership roles

5. **Freelance.com** - Best for:
   - Similar to Upwork - freelance projects
   - Contest-based work
   - Budget-conscious clients
   - NOT suitable for traditional employment
   - NOT suitable for senior/executive roles

## Decision Rules

- For executive roles (CEO, CFO, VP, Director, C-suite): LinkedIn=true, Indeed=true, others=false
- For traditional full-time employment: LinkedIn=true, Indeed=true, freelance platforms=false
- For creative roles: Include Behance
- For freelance/contract explicitly mentioned: Include Upwork and Freelance.com
- For tech/development: LinkedIn=true, Indeed=true, possibly Upwork if freelance
- If user mentions "remote" or "flexible": Consider freelance platforms too
- If query is very broad: Select more platforms
- If query is specific to a platform type: Be selective

## Response Format

Return a JSON object with this exact structure:
{
  "linkedin": true/false,
  "behance": true/false,
  "indeed": true/false,
  "freelance": true/false,
  "upwork": true/false,
  "reasoning": "Brief explanation of why these platforms were selected"
}

At least one platform must be true.`

  const userPrompt = profileSummary
    ? `User Query: "${userQuery}"

User Profile Summary:
${JSON.stringify(profileSummary, null, 2)}

Based on the query and profile, which platforms should we search?`
    : `User Query: "${userQuery}"

No user profile available. Based on the query alone, which platforms should we search?`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3, // Lower temperature for more consistent decisions
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error("No response from AI")
  }

  const parsed = JSON.parse(content)
  
  // Validate and ensure at least one platform is selected
  const selection: SourceSelection = {
    linkedin: Boolean(parsed.linkedin ?? true),
    behance: Boolean(parsed.behance ?? false),
    indeed: Boolean(parsed.indeed ?? true),
    freelance: Boolean(parsed.freelance ?? false),
    upwork: Boolean(parsed.upwork ?? false),
    reasoning: parsed.reasoning || "AI-selected platforms based on query",
  }

  // Ensure at least one platform is selected
  const hasAnySelected = selection.linkedin || selection.behance || selection.indeed || selection.freelance || selection.upwork
  if (!hasAnySelected) {
    selection.linkedin = true
    selection.indeed = true
    selection.reasoning += " (Fallback: enabled LinkedIn and Indeed as no platforms were selected)"
  }

  return selection
}

