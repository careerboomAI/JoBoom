import type { CVData } from "./cv"
import type { PeopleProfileAPIResponse } from "./enrichlayer_linkedin_profile"

/**
 * Unified User Profile - combines data from CV and/or LinkedIn
 * This is the normalized format used throughout the application
 */
export interface UserProfile {
  // Source tracking
  sources: {
    cv?: boolean
    linkedin?: boolean
  }
  
  // Personal Info
  personalInfo: {
    firstName: string
    lastName: string
    fullName: string
    headline?: string
    summary?: string
    gender?: string
    birthDate?: string
    profilePictureUrl?: string
    backgroundImageUrl?: string
  }
  
  // Location
  location?: {
    city?: string
    state?: string
    country?: string
    countryCode?: string
    fullLocation?: string
  }
  
  // Contacts
  contacts: {
    email?: string
    phone?: string
    linkedin?: string
    twitter?: string
    facebook?: string
    github?: string
    website?: string
    other?: string[]
  }
  
  // Professional
  skills: string[]
  
  workExperience: {
    title: string
    company: string
    companyLinkedIn?: string
    location?: string
    startDate?: string
    endDate?: string | "Present"
    description?: string
    logoUrl?: string
  }[]
  
  education: {
    institution: string
    institutionLinkedIn?: string
    degree?: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
    grade?: string
    description?: string
    logoUrl?: string
  }[]
  
  certifications?: {
    name: string
    authority?: string
    licenseNumber?: string
    startDate?: string
    endDate?: string
    url?: string
  }[]
  
  languages?: {
    language: string
    proficiency?: string
  }[]
  
  // LinkedIn specific (optional)
  linkedinData?: {
    publicIdentifier?: string
    connections?: number
    followerCount?: number
    occupation?: string
    industry?: string
    recommendations?: string[]
    volunteerWork?: {
      title: string
      company?: string
      cause?: string
      startDate?: string
      endDate?: string
      description?: string
    }[]
    projects?: {
      title: string
      description?: string
      url?: string
      startDate?: string
      endDate?: string
    }[]
  }
}

/**
 * Helper to format EnrichLayer date to string
 */
function formatDate(date: { day?: number | null; month?: number | null; year?: number | null } | null): string | undefined {
  if (!date || !date.year) return undefined
  
  const parts = []
  if (date.month) parts.push(String(date.month).padStart(2, '0'))
  if (date.year) parts.push(date.year)
  
  return parts.join('/')
}

/**
 * Transform EnrichLayer LinkedIn response to UserProfile
 */
export function linkedinToUserProfile(data: PeopleProfileAPIResponse): UserProfile {
  return {
    sources: { linkedin: true },
    
    personalInfo: {
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      fullName: data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim(),
      headline: data.headline || undefined,
      summary: data.summary || undefined,
      gender: data.gender || undefined,
      birthDate: formatDate(data.birth_date),
      profilePictureUrl: data.profile_pic_url || undefined,
      backgroundImageUrl: data.background_cover_image_url || undefined,
    },
    
    location: {
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country_full_name || undefined,
      countryCode: data.country || undefined,
      fullLocation: [data.city, data.state, data.country_full_name].filter(Boolean).join(", ") || undefined,
    },
    
    contacts: {
      linkedin: data.public_identifier ? `https://linkedin.com/in/${data.public_identifier}` : undefined,
      email: data.personal_emails?.[0] || undefined,
      phone: data.personal_numbers?.[0] || undefined,
      twitter: data.extra?.twitter_profile_id ? `https://twitter.com/${data.extra.twitter_profile_id}` : undefined,
      facebook: data.extra?.facebook_profile_id ? `https://facebook.com/${data.extra.facebook_profile_id}` : undefined,
      github: data.extra?.github_profile_id ? `https://github.com/${data.extra.github_profile_id}` : undefined,
      website: data.extra?.website || undefined,
    },
    
    skills: data.skills || [],
    
    workExperience: (data.experiences || []).map(exp => ({
      title: exp.title,
      company: exp.company,
      companyLinkedIn: exp.company_linkedin_profile_url || undefined,
      location: exp.location || undefined,
      startDate: formatDate(exp.starts_at),
      endDate: exp.ends_at ? formatDate(exp.ends_at) : "Present",
      description: exp.description || undefined,
      logoUrl: exp.logo_url || undefined,
    })),
    
    education: (data.education || []).map(edu => ({
      institution: edu.school,
      institutionLinkedIn: edu.school_linkedin_profile_url || undefined,
      degree: edu.degree_name || undefined,
      fieldOfStudy: edu.field_of_study || undefined,
      startDate: formatDate(edu.starts_at),
      endDate: formatDate(edu.ends_at),
      grade: edu.grade || undefined,
      description: edu.description || undefined,
      logoUrl: edu.logo_url || undefined,
    })),
    
    certifications: (data.certifications || []).map(cert => ({
      name: cert.name,
      authority: cert.authority || undefined,
      licenseNumber: cert.license_number || undefined,
      startDate: formatDate(cert.starts_at),
      endDate: formatDate(cert.ends_at),
      url: cert.url || undefined,
    })),
    
    languages: (data.languages_and_proficiencies || []).map(lang => ({
      language: lang.name,
      proficiency: lang.proficiency || undefined,
    })),
    
    linkedinData: {
      publicIdentifier: data.public_identifier || undefined,
      connections: data.connections || undefined,
      followerCount: data.follower_count || undefined,
      occupation: data.occupation || undefined,
      industry: data.industry || undefined,
      recommendations: data.recommendations || undefined,
      volunteerWork: (data.volunteer_work || []).map(vol => ({
        title: vol.title,
        company: vol.company || undefined,
        cause: vol.cause || undefined,
        startDate: formatDate(vol.starts_at),
        endDate: formatDate(vol.ends_at),
        description: vol.description || undefined,
      })),
      projects: (data.accomplishment_projects || []).map(proj => ({
        title: proj.title,
        description: proj.description || undefined,
        url: proj.url || undefined,
        startDate: formatDate(proj.starts_at),
        endDate: formatDate(proj.ends_at),
      })),
    },
  }
}

/**
 * Transform CVData to UserProfile
 */
export function cvToUserProfile(data: CVData): UserProfile {
  return {
    sources: { cv: true },
    
    personalInfo: {
      firstName: data.personalInfo.name,
      lastName: data.personalInfo.surname,
      fullName: `${data.personalInfo.name} ${data.personalInfo.surname}`.trim(),
      headline: data.personalInfo.headline || undefined,
      summary: data.careerSummary || undefined,
      gender: data.personalInfo.gender || undefined,
      birthDate: data.personalInfo.birthDate || undefined,
    },
    
    location: data.personalInfo.currentLocation ? {
      fullLocation: data.personalInfo.currentLocation,
    } : undefined,
    
    contacts: {
      email: data.contacts.email || undefined,
      phone: data.contacts.phone || undefined,
      linkedin: data.contacts.linkedin || undefined,
      website: data.contacts.website || undefined,
      other: data.contacts.other || undefined,
    },
    
    skills: data.skills || [],
    
    workExperience: (data.workExperience || []).map(exp => ({
      title: exp.title,
      company: exp.company,
      location: exp.location || undefined,
      startDate: exp.startDate || undefined,
      endDate: exp.endDate || undefined,
      description: exp.description || undefined,
    })),
    
    education: (data.education || []).map(edu => ({
      institution: edu.institution,
      degree: edu.degree || undefined,
      fieldOfStudy: edu.fieldOfStudy || undefined,
      startDate: edu.startDate || undefined,
      endDate: edu.endDate || undefined,
      grade: edu.grade || undefined,
      description: edu.description || undefined,
    })),
    
    certifications: (data.licensesAndCertifications || []).map(cert => ({
      name: cert.name,
      authority: cert.issuer || undefined,
      startDate: cert.issueDate || undefined,
      endDate: cert.expirationDate || undefined,
      url: cert.credentialUrl || undefined,
    })),
    
    languages: data.languages || undefined,
  }
}

/**
 * Merge two UserProfiles (e.g., CV + LinkedIn)
 * LinkedIn data takes priority for overlapping fields, but CV data fills gaps
 */
export function mergeUserProfiles(primary: UserProfile, secondary: UserProfile): UserProfile {
  return {
    sources: {
      cv: primary.sources.cv || secondary.sources.cv,
      linkedin: primary.sources.linkedin || secondary.sources.linkedin,
    },
    
    personalInfo: {
      firstName: primary.personalInfo.firstName || secondary.personalInfo.firstName,
      lastName: primary.personalInfo.lastName || secondary.personalInfo.lastName,
      fullName: primary.personalInfo.fullName || secondary.personalInfo.fullName,
      headline: primary.personalInfo.headline || secondary.personalInfo.headline,
      summary: primary.personalInfo.summary || secondary.personalInfo.summary,
      gender: primary.personalInfo.gender || secondary.personalInfo.gender,
      birthDate: primary.personalInfo.birthDate || secondary.personalInfo.birthDate,
      profilePictureUrl: primary.personalInfo.profilePictureUrl || secondary.personalInfo.profilePictureUrl,
      backgroundImageUrl: primary.personalInfo.backgroundImageUrl || secondary.personalInfo.backgroundImageUrl,
    },
    
    location: primary.location || secondary.location,
    
    contacts: {
      email: primary.contacts.email || secondary.contacts.email,
      phone: primary.contacts.phone || secondary.contacts.phone,
      linkedin: primary.contacts.linkedin || secondary.contacts.linkedin,
      twitter: primary.contacts.twitter || secondary.contacts.twitter,
      facebook: primary.contacts.facebook || secondary.contacts.facebook,
      github: primary.contacts.github || secondary.contacts.github,
      website: primary.contacts.website || secondary.contacts.website,
      other: [...(primary.contacts.other || []), ...(secondary.contacts.other || [])],
    },
    
    // Combine and deduplicate skills
    skills: [...new Set([...primary.skills, ...secondary.skills])],
    
    // Use primary work experience, fall back to secondary if empty
    workExperience: primary.workExperience.length > 0 ? primary.workExperience : secondary.workExperience,
    
    // Use primary education, fall back to secondary if empty  
    education: primary.education.length > 0 ? primary.education : secondary.education,
    
    // Combine certifications
    certifications: [...(primary.certifications || []), ...(secondary.certifications || [])],
    
    // Combine languages and deduplicate by name
    languages: (() => {
      const langs = [...(primary.languages || []), ...(secondary.languages || [])]
      const seen = new Set<string>()
      return langs.filter(l => {
        if (seen.has(l.language.toLowerCase())) return false
        seen.add(l.language.toLowerCase())
        return true
      })
    })(),
    
    // LinkedIn data from whichever has it
    linkedinData: primary.linkedinData || secondary.linkedinData,
  }
}

/**
 * Extract simplified profile data for job search query generation
 */
export function extractProfileForSearch(profile: UserProfile) {
  if (!profile) return null
  
  return {
    skills: profile.skills?.slice(0, 20) || [],
    workExperience: (profile.workExperience || []).slice(0, 5).map(exp => ({
      title: exp.title,
      company: exp.company,
      description: exp.description?.substring(0, 300),
    })),
    education: (profile.education || []).slice(0, 3).map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
    })),
    headline: profile.personalInfo?.headline,
    summary: profile.personalInfo?.summary?.substring(0, 500),
    location: profile.location?.fullLocation,
    languages: profile.languages?.map(l => l.language),
    certifications: profile.certifications?.slice(0, 5).map(c => c.name),
    industry: profile.linkedinData?.industry,
  }
}

