import { NextRequest, NextResponse } from "next/server"
import type { PeopleProfileAPIResponse } from "@/types/enrichlayer_linkedin_profile"
import { linkedinToUserProfile } from "@/types/user-profile"

const ENRICHLAYER_API_KEY = process.env.ENRICHLAYER_API_KEY

/**
 * Validates and normalizes a LinkedIn URL
 * Returns normalized format: https://www.linkedin.com/in/username/
 */
function validateAndNormalizeLinkedinUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: "LinkedIn URL is required" }
  }

  // Regex to match linkedin.com/in/username in various formats
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)\/?/i
  const match = url.match(linkedinRegex)

  if (!match || !match[1]) {
    return { 
      valid: false, 
      error: "Invalid LinkedIn URL. Expected format: linkedin.com/in/username" 
    }
  }

  const username = match[1]
  const normalized = `https://www.linkedin.com/in/${username}/`
  
  return { valid: true, normalized }
}

/**
 * POST /api/linkedin-profile
 * Fetches a LinkedIn profile from EnrichLayer and returns normalized UserProfile data
 */
export async function POST(request: NextRequest) {
  try {
    const { linkedinUrl } = await request.json()

    // Validate and normalize the URL
    const urlValidation = validateAndNormalizeLinkedinUrl(linkedinUrl)
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      )
    }

    const normalizedUrl = urlValidation.normalized!
    console.log("📥 Received URL:", linkedinUrl)
    console.log("✅ Normalized URL:", normalizedUrl)

    if (!ENRICHLAYER_API_KEY) {
      return NextResponse.json(
        { error: "ENRICHLAYER_API_KEY not configured" },
        { status: 500 }
      )
    }

    // Build EnrichLayer API URL with query params
    const apiUrl = new URL("https://enrichlayer.com/api/v2/profile")
    apiUrl.searchParams.set("profile_url", normalizedUrl)
    apiUrl.searchParams.set("skills", "include")
    apiUrl.searchParams.set("extra", "include")
    apiUrl.searchParams.set("use_cache", "if-present")
    apiUrl.searchParams.set("fallback_to_cache", "on-error")

    console.log("🔗 Fetching LinkedIn profile from EnrichLayer:", normalizedUrl)

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${ENRICHLAYER_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("EnrichLayer API error:", response.status, errorText)
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: "LinkedIn profile not found" },
          { status: 404 }
        )
      }
      
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "Invalid or expired API key" },
          { status: 401 }
        )
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: `EnrichLayer API error: ${response.status}` },
        { status: response.status }
      )
    }

    const linkedinData: PeopleProfileAPIResponse = await response.json()
    
    console.log("🔗 LinkedIn Raw Response from EnrichLayer:")
    console.log(JSON.stringify(linkedinData, null, 2))
    
    // Check if we got a thin/empty profile
    if (!linkedinData.first_name && !linkedinData.last_name && !linkedinData.full_name) {
      return NextResponse.json(
        { error: "Could not retrieve profile data. The profile may be private or unavailable." },
        { status: 404 }
      )
    }

    // Transform to unified UserProfile format
    const userProfile = linkedinToUserProfile(linkedinData)
    
    console.log("🔗 LinkedIn Normalized UserProfile:")
    console.log(JSON.stringify(userProfile, null, 2))

    // Get credit cost from response headers
    const creditCost = response.headers.get("X-EnrichLayer-Credit-Cost")
    console.log(`💳 EnrichLayer Credit Cost: ${creditCost || 1}`)

    return NextResponse.json({
      success: true,
      data: userProfile,
      raw: linkedinData, // Include raw data for debugging/advanced use
      meta: {
        creditCost: creditCost ? parseInt(creditCost) : 1,
      },
    })

  } catch (error: any) {
    console.error("LinkedIn Profile API Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch LinkedIn profile" },
      { status: 500 }
    )
  }
}

