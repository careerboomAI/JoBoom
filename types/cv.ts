export interface CVData {
  personalInfo: {
    name: string
    surname: string
    headline?: string
    gender?: string
    currentLocation?: string
    birthDate?: string // ISO date string or simplified format
  }
  careerSummary?: string
  contacts: {
    email?: string
    phone?: string
    linkedin?: string
    website?: string
    other?: string[]
  }
  skills: string[]
  licensesAndCertifications?: {
    name: string
    issuer?: string
    issueDate?: string
    expirationDate?: string
    credentialId?: string
    credentialUrl?: string
  }[]
  workExperience: {
    title: string
    company: string
    location?: string
    startDate?: string
    endDate?: string | "Present"
    description?: string
    skillsUsed?: string[]
  }[]
  education: {
    institution: string
    degree?: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
    grade?: string
    description?: string
  }[]
  languages?: {
    language: string
    proficiency?: string
  }[]
}

