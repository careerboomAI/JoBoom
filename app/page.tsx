"use client"

import { useState, useCallback, useRef } from "react"
import { Icon } from "@iconify/react"
import { Github, Loader2 } from "lucide-react"
import Image from "next/image"
import { SearchBar } from "@/components/search-bar"
import { SearchSuggestions } from "@/components/search-suggestions"
import { JobGrid } from "@/components/job-grid"
import { ResultsHeader } from "@/components/results-header"
import { EmptyState } from "@/components/empty-state"
import { ThemeToggle } from "@/components/theme-toggle"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { UserProfileCard } from "@/components/user-profile-card"
import { useToast } from "@/hooks/use-toast"
import type { AnyJobResult } from "@/components/job-grid"
import type { UserProfile } from "@/types/user-profile"
import type { Source } from "@/components/search-suggestions"
import { cvToUserProfile, mergeUserProfiles, extractProfileForSearch } from "@/types/user-profile"

export default function Home() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    auto: true,
    linkedin: true,
    upwork: true,
    behance: true,
    glassdoor: true,
    indeed: true,
    freelance: true,
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isParsingCV, setIsParsingCV] = useState(false)
  const [linkedinUrl, setLinkedinUrl] = useState<string>("")
  const [isFetchingLinkedIn, setIsFetchingLinkedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchingProviders, setSearchingProviders] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<AnyJobResult[]>([])
  const [totalMatches, setTotalMatches] = useState(0)
  const [showProfilePanel, setShowProfilePanel] = useState(true)
  
  // Ref to track if current search is still active/valid
  const searchIdRef = useRef(0)

  const handleCVUpload = async (file: File) => {
    setCvFile(file)
    setIsParsingCV(true)
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to parse CV")
      }

      const { data } = await response.json()
      const cvProfile = cvToUserProfile(data)
      
      console.log("📄 CV Parsed Data:", JSON.stringify(cvProfile, null, 2))
      
      // Merge with existing profile if we have LinkedIn data
      if (userProfile?.sources.linkedin) {
        const merged = mergeUserProfiles(userProfile, cvProfile)
        console.log("🔀 Merged Profile (LinkedIn + CV):", JSON.stringify(merged, null, 2))
        setUserProfile(merged)
      } else {
        setUserProfile(cvProfile)
      }
      
      toast({
        title: "CV Uploaded & Parsed",
        description: `Successfully extracted info for ${data.personalInfo.name} ${data.personalInfo.surname}`,
      })

    } catch (error) {
      console.error("CV upload error:", error)
      toast({
        title: "Error parsing CV",
        description: "Could not extract information from the file. Please try a different file.",
        variant: "destructive",
      })
    } finally {
      setIsParsingCV(false)
    }
  }

  const handleLinkedinUrlSubmit = async (url: string) => {
    // Skip if we already fetched this URL
    if (url === linkedinUrl && userProfile?.sources.linkedin) {
      console.log("LinkedIn profile already loaded for this URL, skipping API call")
      return
    }
    
    setLinkedinUrl(url)
    setIsFetchingLinkedIn(true)
    
    try {
      const response = await fetch("/api/linkedin-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl: url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch LinkedIn profile")
      }

      const { data: linkedinProfile, raw: rawLinkedinData } = await response.json()
      
      console.log("🔗 LinkedIn Raw Response:", JSON.stringify(rawLinkedinData, null, 2))
      console.log("🔗 LinkedIn Normalized Profile:", JSON.stringify(linkedinProfile, null, 2))
      
      // Merge with existing profile if we have CV data
      if (userProfile?.sources.cv) {
        const merged = mergeUserProfiles(linkedinProfile, userProfile)
        console.log("🔀 Merged Profile (LinkedIn + CV):", JSON.stringify(merged, null, 2))
        setUserProfile(merged)
      } else {
        setUserProfile(linkedinProfile)
      }
      
      toast({
        title: "LinkedIn Profile Loaded",
        description: `Successfully loaded profile for ${linkedinProfile.personalInfo.fullName}`,
      })

    } catch (error: any) {
      console.error("LinkedIn fetch error:", error)
      toast({
        title: "Error loading LinkedIn profile",
        description: error.message || "Could not load LinkedIn profile. Please check the URL and try again.",
        variant: "destructive",
      })
    } finally {
      setIsFetchingLinkedIn(false)
    }
  }

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return

    const currentSearchId = ++searchIdRef.current
    setIsLoading(true)
    setHasSearched(true)
    setResults([])
    setTotalMatches(0)

    // Prepare user profile for search (if available)
    const profileForSearch = userProfile ? extractProfileForSearch(userProfile) : undefined

    // Determine which sources to search
    let sourcesToSearch = {
      linkedin: filters.linkedin,
      behance: filters.behance,
      indeed: filters.indeed,
      freelance: filters.freelance,
      upwork: filters.upwork,
    }

    // If Auto mode is enabled, ask AI which sources to use
    if (filters.auto) {
      console.log("🤖 Auto mode enabled - asking AI for source selection...")
      setSearchingProviders(['ai-selecting']) // Show loading state
      
      try {
        const response = await fetch("/api/select-sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: searchQuery,
            userProfile: profileForSearch 
          }),
        })
        const data = await response.json()
        
        if (data.success && data.selection) {
          sourcesToSearch = {
            linkedin: data.selection.linkedin,
            behance: data.selection.behance,
            indeed: data.selection.indeed,
            freelance: data.selection.freelance,
            upwork: data.selection.upwork,
          }
          console.log("✅ AI selected sources:", sourcesToSearch)
          console.log("📝 Reasoning:", data.selection.reasoning)
          
          toast({
            title: "AI Source Selection",
            description: data.selection.reasoning,
          })
        }
      } catch (error) {
        console.error("AI source selection failed, using all sources:", error)
        // Fallback to all sources
        sourcesToSearch = {
          linkedin: true,
          behance: true,
          indeed: true,
          freelance: true,
          upwork: true,
        }
      }
    }
    
    // Set loading state for selected providers
    const activeProviders: string[] = []
    if (sourcesToSearch.linkedin) activeProviders.push('linkedin')
    if (sourcesToSearch.upwork) activeProviders.push('upwork')
    if (sourcesToSearch.behance) activeProviders.push('behance')
    if (sourcesToSearch.indeed) activeProviders.push('indeed')
    if (sourcesToSearch.freelance) activeProviders.push('freelance')
    setSearchingProviders(activeProviders)

    // Helper to process results as they come in
    const handleProviderResult = async (source: string, data: any, error?: any) => {
      // If a new search started, ignore old results
      if (currentSearchId !== searchIdRef.current) return

      // Remove from searching list
      setSearchingProviders(prev => prev.filter(p => p !== source))

      if (error) {
        console.error(`${source} search error:`, error)
        return
      }

      if (data?.results) {
        setResults(prev => [...prev, ...data.results])
        setTotalMatches(prev => prev + data.results.length)
      }
    }

    // Launch requests in parallel but handle independently
    const promises = []

    // LinkedIn job search
    if (sourcesToSearch.linkedin) {
      promises.push(
        fetch("/api/job-search/linkedin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: searchQuery,
              userProfile: profileForSearch 
            }),
          })
          .then(res => res.json())
          .then(data => handleProviderResult('linkedin', data))
          .catch(err => handleProviderResult('linkedin', undefined, err))
      )
    }

    // Upwork job search
    if (sourcesToSearch.upwork) {
      promises.push(
        fetch("/api/job-search/upwork", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: searchQuery,
              userProfile: profileForSearch 
            }),
          })
          .then(res => res.json())
          .then(data => handleProviderResult('upwork', data))
          .catch(err => handleProviderResult('upwork', undefined, err))
      )
    }
    
    // Behance job search
    if (sourcesToSearch.behance) {
      promises.push(
        fetch("/api/job-search/behance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: searchQuery,
              userProfile: profileForSearch 
            }),
          })
          .then(res => res.json())
          .then(data => handleProviderResult('behance', data))
          .catch(err => handleProviderResult('behance', undefined, err))
      )
    }
    
    // Indeed job search
    if (sourcesToSearch.indeed) {
      promises.push(
        fetch("/api/job-search/indeed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: searchQuery,
              userProfile: profileForSearch 
            }),
          })
          .then(res => res.json())
          .then(data => handleProviderResult('indeed', data))
          .catch(err => handleProviderResult('indeed', undefined, err))
      )
    }
    
    // Freelance.com job search
    if (sourcesToSearch.freelance) {
      promises.push(
        fetch("/api/job-search/freelance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: searchQuery,
              userProfile: profileForSearch 
            }),
          })
          .then(res => res.json())
          .then(data => handleProviderResult('freelance', data))
          .catch(err => handleProviderResult('freelance', undefined, err))
      )
    }

    try {
      await Promise.all(promises)
    } catch (error) {
      console.error("Global search error:", error)
    } finally {
      if (currentSearchId === searchIdRef.current) {
        setIsLoading(false)
        setSearchingProviders([])
      }
    }
  }, [searchQuery, filters, userProfile, toast])

  const handleSuggestionClick = (suggestion: string, sources: Source[]) => {
    setSearchQuery(suggestion)
    
    // Update filters based on selected sources
    if (sources.includes("auto")) {
      // If auto is in sources, enable auto mode and disable specific sources
      setFilters({
        auto: true,
        linkedin: false,
        upwork: false,
        behance: false,
        glassdoor: false,
        indeed: false,
        freelance: false,
      })
    } else {
      // Disable auto and enable only the specified sources
      setFilters({
        auto: false,
        linkedin: sources.includes("linkedin"),
        upwork: sources.includes("upwork"),
        behance: sources.includes("behance"),
        glassdoor: false,
        indeed: sources.includes("indeed"),
        freelance: sources.includes("freelance"),
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <header>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image 
                  src="/logo.svg" 
                  alt="JoBoom Logo" 
                  width={40} 
                  height={40}
                  className="w-10 h-10"
                />
                <span className="text-xl font-bold text-foreground">JoBoom</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://github.com/careerboomAI/JoBoom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Github className="h-4 w-4" />
                    <span className="hidden sm:inline">Fork on GitHub</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto flex w-full flex-col gap-4 mb-8">
              <h1 className="text-pretty text-center font-semibold text-[29px] text-foreground tracking-tight sm:text-[32px] md:text-[46px]">
                Let AI Find Your Dream Job
              </h1>
              <h2 className="-mt-2 pb-2 text-center text-lg md:text-xl text-muted-foreground">
                Add your career info and AI will find you jobs across multiple platforms
              </h2>
            </div>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              isLoading={isLoading || searchingProviders.length > 0}
              filters={filters}
              onFilterChange={(filter, checked) => setFilters((prev) => ({ ...prev, [filter]: checked }))}
              onCVUpload={handleCVUpload}
              onLinkedinUrlSubmit={handleLinkedinUrlSubmit}
              cvFile={cvFile}
              isParsingCV={isParsingCV}
              linkedinUrl={linkedinUrl}
              isFetchingLinkedIn={isFetchingLinkedIn}
            />

            {!hasSearched && <SearchSuggestions onSuggestionClick={handleSuggestionClick} />}
          </div>
        </section>

        {/* Results Section */}
        {hasSearched && (
          <section className="pb-16">
            <div className="container mx-auto px-4">
              
              {/* Loading Status Indicator */}
              {searchingProviders.length > 0 && (
                 <div className="flex items-center justify-center py-8 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-card border border-border rounded-full px-6 py-3 shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Searching on:</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {searchingProviders.includes('linkedin') && (
                        <div className="flex items-center gap-1.5 animate-pulse">
                          <Icon icon="mdi:linkedin" className="h-4 w-4 text-[#0077b5]" />
                          <span className="text-sm font-medium">LinkedIn</span>
                        </div>
                      )}
                      {searchingProviders.includes('upwork') && (
                         <div className="flex items-center gap-1.5 animate-pulse">
                          <Icon icon="simple-icons:upwork" className="h-4 w-4 text-[#14A800]" />
                          <span className="text-sm font-medium">Upwork</span>
                        </div>
                      )}
                      {searchingProviders.includes('behance') && (
                         <div className="flex items-center gap-1.5 animate-pulse">
                          <Icon icon="mdi:behance" className="h-4 w-4 text-[#1769ff]" />
                          <span className="text-sm font-medium">Behance</span>
                        </div>
                      )}
                      {searchingProviders.includes('glassdoor') && (
                         <div className="flex items-center gap-1.5 animate-pulse">
                          <Icon icon="cib:glassdoor" className="h-4 w-4 text-[#0CAA41]" />
                          <span className="text-sm font-medium">Glassdoor</span>
                        </div>
                      )}
                      {searchingProviders.includes('indeed') && (
                         <div className="flex items-center gap-1.5 animate-pulse">
                          <Icon icon="simple-icons:indeed" className="h-4 w-4 text-[#003A9B]" />
                          <span className="text-sm font-medium">Indeed</span>
                        </div>
                      )}
                      {searchingProviders.includes('freelance') && (
                         <div className="flex items-center gap-1.5 animate-pulse">
                          <Icon icon="simple-icons:freelancer" className="h-4 w-4 text-[#29B2FE]" />
                          <span className="text-sm font-medium">Freelance.com</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {results.length > 0 ? (
                <>
                  <ResultsHeader 
                    count={results.length} 
                    total={totalMatches}
                    userProfile={userProfile}
                    showProfilePanel={showProfilePanel}
                    onToggleProfilePanel={() => setShowProfilePanel(true)}
                  />
                  
                  {/* Two-column layout: Profile on left, Jobs on right */}
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left sidebar - User Profile Card (only shown if profile exists and panel is visible) */}
                    {userProfile && showProfilePanel && (
                      <aside className="lg:w-80 xl:w-96 flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="lg:sticky lg:top-4">
                          <UserProfileCard 
                            profile={userProfile}
                            onHide={() => setShowProfilePanel(false)}
                          />
                        </div>
                      </aside>
                    )}
                    
                    {/* Right content - Job Grid */}
                    <div className="flex-1 min-w-0">
                      <JobGrid jobs={results} />
                    </div>
                  </div>
                </>
              ) : (
                 /* Show empty state only if we are completely done searching and found nothing */
                 searchingProviders.length === 0 && <EmptyState />
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
