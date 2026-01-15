/** NUBELA PROXICURL API https://enrichlayer.com/api/v2/profile
 * Person Profile Endpoint
 * GET /enrichlayer.com/api/v2/profile
 *
 * Cost: 1 credit / successful request. Extra charges might be incurred if premium optional parameters are used.
 * Credits are charged even if a successful request returns an empty result.
 *
 * Get structured data of a LinkedIn Personal Profile
 */

// API QUERY TYPES ------------------------------------------------------------------------------------------------------------------------------
/**
 * Parameters required for the LinkedIn People Profile API request
 */
export interface PeopleProfileAPIParams {
    linkedin_profile_url?: string // LinkedIn profile URL, e.g., "https://linkedin.com/in/johnrmarty/"
    twitter_profile_url?: string // Twitter/X profile URL, e.g., "https://x.com/johnrmarty/"
    facebook_profile_url?: string // Facebook profile URL, e.g., "https://facebook.com/johnrmarty/"
    extra?: 'include' | 'exclude' // Enriches profile with extra details, default: 'exclude'
    github_profile_id?: 'include' | 'exclude' // Include Github ID, default: 'exclude'
    facebook_profile_id?: 'include' | 'exclude' // Include Facebook ID, default: 'exclude'
    twitter_profile_id?: 'include' | 'exclude' // Include Twitter ID, default: 'exclude'
    personal_contact_number?: 'include' | 'exclude' // Include personal phone numbers, default: 'exclude'
    personal_email?: 'include' | 'exclude' // Include personal emails, default: 'exclude'
    inferred_salary?: 'include' | 'exclude' // Include inferred salary range, default: 'exclude'
    skills?: 'include' | 'exclude' // Include skills data, default: 'exclude'
    use_cache?: 'if-present' | 'if-recent' // Cache usage strategy, default: 'if-recent'
    fallback_to_cache?: 'on-error' | 'never' // Cache fallback strategy, default: 'on-error'
  }
  
  // API RESPONSE TYPES ------------------------------------------------------------------------------------------------------------------------------
  
  /**
   * Represents a date with day, month, and year
   */
  export interface Date {
    day: number | null // Day of the month
    month: number | null // Month (1-12)
    year: number | null // Year (e.g. 2023)
  }
  
  /**
   * Represents a work experience entry
   */
  export interface Experience {
    starts_at: Date | null // Start date of experience
    ends_at: Date | null // End date of experience (null if current)
    company: string // Company name
    company_linkedin_profile_url: string | null // LinkedIn company profile URL
    company_facebook_profile_url: string | null // Facebook company profile URL
    title: string // Job title
    description: string | null // Job description
    location: string | null // Job location
    logo_url: string | null // Company logo URL
  }
  
  /**
   * Represents an education entry
   */
  export interface Education {
    starts_at: Date | null // Start date of education
    ends_at: Date | null // End date of education
    field_of_study: string | null // Field of study
    degree_name: string | null // Degree name (e.g. "Master of Business Administration")
    school: string // School name
    school_linkedin_profile_url: string | null // LinkedIn school profile URL
    school_facebook_profile_url: string | null // Facebook school profile URL
    description: string | null // Education description
    logo_url: string | null // School logo URL
    grade: string | null // Grade obtained
    activities_and_societies: string | null // Activities and societies
  }
  
  /**
   * Represents a language with proficiency level
   */
  export interface Language {
    name: string // Language name
    proficiency:
      | 'ELEMENTARY'
      | 'LIMITED_WORKING'
      | 'PROFESSIONAL_WORKING'
      | 'FULL_PROFESSIONAL'
      | 'NATIVE_OR_BILINGUAL'
      | null // Proficiency level
  }
  
  /**
   * Represents an accomplishment organization
   */
  export interface AccomplishmentOrg {
    starts_at: Date | null // Start date
    ends_at: Date | null // End date
    org_name: string // Organization name
    title: string // Title in organization
    description: string | null // Description
  }
  
  /**
   * Represents a publication accomplishment
   */
  export interface Publication {
    name: string // Publication name
    publisher: string | null // Publisher
    published_on: Date | null // Publication date
    description: string | null // Description
    url: string | null // URL to publication
  }
  
  /**
   * Represents an honor or award
   */
  export interface HonourAward {
    title: string // Award title
    issuer: string | null // Issuing organization
    issued_on: Date | null // Date awarded
    description: string | null // Description
  }
  
  /**
   * Represents a patent
   */
  export interface Patent {
    title: string // Patent title
    issuer: string | null // Issuing organization
    issued_on: Date | null // Date issued
    description: string | null // Description
    application_number: string | null // Application number
    patent_number: string | null // Patent number
    url: string | null // URL to patent
  }
  
  /**
   * Represents a course accomplishment
   */
  export interface Course {
    name: string // Course name
    number: string | null // Course number
  }
  
  /**
   * Represents a project accomplishment
   */
  export interface Project {
    starts_at: Date | null // Start date
    ends_at: Date | null // End date
    title: string // Project title
    description: string | null // Project description
    url: string | null // Project URL
  }
  
  /**
   * Represents a test score accomplishment
   */
  export interface TestScore {
    name: string // Test name
    score: string // Score
    date_on: Date | null // Test date
    description: string | null // Description
  }
  
  /**
   * Represents a volunteering experience
   */
  export interface VolunteeringExperience {
    starts_at: Date | null // Start date
    ends_at: Date | null // End date
    title: string // Volunteer title
    cause: string | null // Volunteer cause
    company: string | null // Organization name
    company_linkedin_profile_url: string | null // LinkedIn company profile URL
    description: string | null // Description
    logo_url: string | null // Organization logo URL
  }
  
  /**
   * Represents a certification
   */
  export interface Certification {
    starts_at: Date | null // Start date
    ends_at: Date | null // End date
    name: string // Certification name
    license_number: string | null // License number
    display_source: string | null // Display source
    authority: string | null // Authority
    url: string | null // Certification URL
  }
  
  /**
   * Represents a profile in "people also viewed" section
   */
  export interface PeopleAlsoViewed {
    link: string // Profile URL
    name: string // Name
    summary: string | null // Summary
    location: string | null // Location
  }
  
  /**
   * Represents a LinkedIn activity
   */
  export interface Activity {
    title: string | null // Activity title
    link: string | null // Activity link
    activity_status: string | null // Activity status
  }
  
  /**
   * Represents a similar profile
   */
  export interface SimilarProfile {
    name: string // Name
    link: string // Profile URL
    summary: string | null // Summary
    location: string | null // Location
  }
  
  /**
   * Represents an article
   */
  export interface Article {
    title: string // Article title
    link: string // Article link
    published_date: Date | null // Publication date
    author: string | null // Author
    image_url: string | null // Article image URL
  }
  
  /**
   * Represents a LinkedIn group
   */
  export interface PersonGroup {
    profile_pic_url: string | null // Group profile picture
    name: string // Group name
    url: string | null // Group URL
  }
  
  /**
   * Represents an inferred salary
   */
  export interface InferredSalary {
    min: number | null // Minimum salary
    max: number | null // Maximum salary
  }
  
  /**
   * Represents extra profile data
   */
  export interface PersonExtra {
    github_profile_id: string | null // GitHub profile ID
    facebook_profile_id: string | null // Facebook profile ID
    twitter_profile_id: string | null // Twitter profile ID
    website: string | null // Website
  }
  
  /**
   * Represents the complete response from the LinkedIn People Profile API
   */
  export interface PeopleProfileAPIResponse {
    public_identifier: string | null // LinkedIn profile identifier (after /in/ in URL)
    profile_pic_url: string | null // Profile picture URL
    background_cover_image_url: string | null // Background cover image URL
    first_name: string | null // First name
    last_name: string | null // Last name
    full_name: string | null // Full name
    follower_count: number | null // Number of followers
    occupation: string | null // Current occupation (title at company)
    headline: string | null // Profile headline
    summary: string | null // Profile summary
    country: string | null // Country code (ISO 3166-1 alpha-2)
    country_full_name: string | null // Full country name
    city: string | null // City name
    state: string | null // State or region
    experiences: Experience[] // Work experiences
    education: Education[] // Education history
    languages: string[] // Languages
    languages_and_proficiencies: Language[] // Languages with proficiency
    accomplishment_organisations: AccomplishmentOrg[] // Organization accomplishments
    accomplishment_publications: Publication[] // Publication accomplishments
    accomplishment_honors_awards: HonourAward[] // Honors and awards
    accomplishment_patents: Patent[] // Patents
    accomplishment_courses: Course[] // Courses
    accomplishment_projects: Project[] // Projects
    accomplishment_test_scores: TestScore[] // Test scores
    volunteer_work: VolunteeringExperience[] // Volunteer work
    certifications: Certification[] // Certifications
    connections: number | null // Number of connections
    people_also_viewed: PeopleAlsoViewed[] // Related profiles
    recommendations: string[] // Recommendations
    activities: Activity[] // LinkedIn activities
    similarly_named_profiles: SimilarProfile[] // Similarly named profiles
    articles: Article[] // Articles
    groups: PersonGroup[] // LinkedIn groups
    skills: string[] // Skills
    inferred_salary: InferredSalary | null // Inferred salary
    gender: string | null // Gender
    birth_date: Date | null // Birth date
    industry: string | null // Industry
    extra: PersonExtra | null // Extra data
    interests: string[] // Interests
    personal_emails: string[] // Personal emails
    personal_numbers: string[] // Personal phone numbers
  }