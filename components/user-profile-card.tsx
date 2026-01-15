"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import {
  User,
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  Building2,
  Sparkles,
  FileText,
  Users,
  Heart,
  FolderKanban,
  EyeOff,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/types/user-profile"

interface UserProfileCardProps {
  profile: UserProfile
  onHide?: () => void
  className?: string
}

function formatDateRange(start?: string, end?: string | "Present"): string {
  if (!start && !end) return ""
  if (start && !end) return start
  if (!start && end) return end === "Present" ? "Present" : end
  return `${start} — ${end}`
}

// Section IDs for accordion behavior
type SectionId = "skills" | "experience" | "education" | "certifications" | "languages" | "projects" | "volunteer"

function ProfileSection({
  id,
  title,
  icon: IconComponent,
  children,
  count,
  openSection,
  onToggle,
}: {
  id: SectionId
  title: string
  icon: React.ElementType
  children: React.ReactNode
  count?: number
  openSection: SectionId | null
  onToggle: (id: SectionId) => void
}) {
  const isOpen = openSection === id

  return (
    <div className="border-t border-border/50 pt-3">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between text-left group hover:text-primary transition-colors py-1"
      >
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{title}</span>
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {count}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[400px] opacity-100 mt-2 overflow-y-auto" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  )
}

function ExperienceItem({
  title,
  company,
  companyLinkedIn,
  location,
  startDate,
  endDate,
  description,
  logoUrl,
}: {
  title: string
  company: string
  companyLinkedIn?: string
  location?: string
  startDate?: string
  endDate?: string | "Present"
  description?: string
  logoUrl?: string
}) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 border-b border-border/30 last:border-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={company}
          className="h-10 w-10 rounded-lg object-cover bg-muted flex-shrink-0"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground">{title}</h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          {companyLinkedIn ? (
            <a
              href={companyLinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {company}
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">{company}</span>
          )}
          {location && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-xs text-muted-foreground">{location}</span>
            </>
          )}
        </div>
        {(startDate || endDate) && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/80">
            <Calendar className="h-3 w-3" />
            <span>{formatDateRange(startDate, endDate)}</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

function EducationItem({
  institution,
  institutionLinkedIn,
  degree,
  fieldOfStudy,
  startDate,
  endDate,
  grade,
  description,
  logoUrl,
}: {
  institution: string
  institutionLinkedIn?: string
  degree?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
  grade?: string
  description?: string
  logoUrl?: string
}) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 border-b border-border/30 last:border-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={institution}
          className="h-10 w-10 rounded-lg object-cover bg-muted flex-shrink-0"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {institutionLinkedIn ? (
          <a
            href={institutionLinkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-foreground hover:text-primary transition-colors"
          >
            {institution}
          </a>
        ) : (
          <h4 className="font-medium text-sm text-foreground">{institution}</h4>
        )}
        {(degree || fieldOfStudy) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {[degree, fieldOfStudy].filter(Boolean).join(" in ")}
          </p>
        )}
        {(startDate || endDate) && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/80">
            <Calendar className="h-3 w-3" />
            <span>{formatDateRange(startDate, endDate)}</span>
          </div>
        )}
        {grade && (
          <p className="text-xs text-muted-foreground mt-1">Grade: {grade}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

function CertificationItem({
  name,
  authority,
  startDate,
  endDate,
  url,
}: {
  name: string
  authority?: string
  startDate?: string
  endDate?: string
  url?: string
}) {
  return (
    <div className="py-2.5 first:pt-0 border-b border-border/30 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {name}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <h4 className="font-medium text-sm text-foreground">{name}</h4>
          )}
          {authority && (
            <p className="text-xs text-muted-foreground mt-0.5">{authority}</p>
          )}
        </div>
        {(startDate || endDate) && (
          <span className="text-xs text-muted-foreground/80 whitespace-nowrap">
            {formatDateRange(startDate, endDate)}
          </span>
        )}
      </div>
    </div>
  )
}

export function UserProfileCard({
  profile,
  onHide,
  className,
}: UserProfileCardProps) {
  // Accordion: only one section open at a time, default to "skills"
  const [openSection, setOpenSection] = useState<SectionId | null>("skills")

  const handleToggleSection = (id: SectionId) => {
    setOpenSection(prev => prev === id ? null : id)
  }

  const hasContactInfo =
    profile.contacts.email ||
    profile.contacts.phone ||
    profile.contacts.linkedin ||
    profile.contacts.twitter ||
    profile.contacts.github ||
    profile.contacts.website

  return (
    <Card
      className={cn(
        "overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.02]",
        className
      )}
    >
      <CardContent className="p-0 flex flex-col max-h-[calc(100vh-8rem)]">
        {/* Header section with photo and info side by side */}
        <div className="flex-shrink-0 p-4 pb-3 border-b border-border/30">
          <div className="flex gap-3">
            {/* Profile picture */}
            <div className="relative flex-shrink-0">
              {profile.personalInfo.profilePictureUrl ? (
                <img
                  src={profile.personalInfo.profilePictureUrl}
                  alt={profile.personalInfo.fullName}
                  className="h-14 w-14 rounded-xl object-cover shadow-md"
                />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-primary/10 shadow-md flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
              )}
              
              {/* Source badges - overlapping the photo corner */}
              <div className="absolute -bottom-1 -right-1 flex">
                {profile.sources.linkedin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-5 w-5 rounded-full bg-[#0077b5] flex items-center justify-center shadow-lg border-2 border-card cursor-default hover:scale-110 transition-transform">
                        <Icon icon="mdi:linkedin" className="h-3 w-3 text-white" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Imported from LinkedIn
                    </TooltipContent>
                  </Tooltip>
                )}
                {profile.sources.cv && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-card cursor-default hover:scale-110 transition-transform",
                        profile.sources.linkedin && "-ml-1.5"
                      )}>
                        <FileText className="h-2.5 w-2.5 text-white" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Imported from CV
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Profile info - right of photo */}
            <div className="flex-1 min-w-0">
              {/* Name */}
              <h3 className="font-semibold text-base text-foreground truncate leading-tight">
                {profile.personalInfo.fullName}
              </h3>
              
              {/* Headline */}
              {profile.personalInfo.headline && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {profile.personalInfo.headline}
                </p>
              )}
              
              {/* Location & Industry on same line */}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                {profile.location?.fullLocation && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[100px]">{profile.location.fullLocation}</span>
                  </div>
                )}
                {profile.linkedinData?.industry && (
                  <>
                    {profile.location?.fullLocation && <span className="text-muted-foreground/40">•</span>}
                    <span className="truncate">{profile.linkedinData.industry}</span>
                  </>
                )}
              </div>

              {/* LinkedIn stats */}
              {profile.linkedinData && (profile.linkedinData.connections !== undefined || profile.linkedinData.followerCount !== undefined) && (
                <div className="flex items-center gap-3 mt-1">
                  {profile.linkedinData.connections !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{profile.linkedinData.connections.toLocaleString()}</span>
                    </div>
                  )}
                  {profile.linkedinData.followerCount !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>{profile.linkedinData.followerCount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hide button */}
            {onHide && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onHide}
                    className="h-7 w-7 flex-shrink-0 -mt-1 -mr-1"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hide profile panel</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="px-4 py-3 overflow-y-auto flex-1 min-h-0">
          {/* Content sections */}
          <div>
            {/* Summary */}
            {profile.personalInfo.summary && (
              <div className="bg-muted/30 rounded-lg p-2.5 mb-3">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {profile.personalInfo.summary}
                </p>
              </div>
            )}

            {/* Contact info */}
            {hasContactInfo && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {profile.contacts.email && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`mailto:${profile.contacts.email}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Mail className="h-3 w-3" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>{profile.contacts.email}</TooltipContent>
                  </Tooltip>
                )}
                {profile.contacts.phone && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`tel:${profile.contacts.phone}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>{profile.contacts.phone}</TooltipContent>
                  </Tooltip>
                )}
                {profile.contacts.linkedin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.contacts.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0077b5]/10 text-xs text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors"
                      >
                        <Icon icon="mdi:linkedin" className="h-3 w-3" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>LinkedIn Profile</TooltipContent>
                  </Tooltip>
                )}
                {profile.contacts.github && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.contacts.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Icon icon="mdi:github" className="h-3 w-3" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>GitHub Profile</TooltipContent>
                  </Tooltip>
                )}
                {profile.contacts.twitter && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.contacts.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Icon icon="mdi:twitter" className="h-3 w-3" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Twitter Profile</TooltipContent>
                  </Tooltip>
                )}
                {profile.contacts.website && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.contacts.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Globe className="h-3 w-3" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Website</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Skills */}
            {profile.skills.length > 0 && (
              <ProfileSection
                id="skills"
                title="Skills"
                icon={Sparkles}
                count={profile.skills.length}
                openSection={openSection}
                onToggle={handleToggleSection}
              >
                <div className="flex flex-wrap gap-1.5 pr-1">
                  {profile.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Work Experience */}
            {profile.workExperience.length > 0 && (
              <ProfileSection
                id="experience"
                title="Experience"
                icon={Briefcase}
                count={profile.workExperience.length}
                openSection={openSection}
                onToggle={handleToggleSection}
              >
                <div className="space-y-0 pr-1">
                  {profile.workExperience.map((exp, index) => (
                    <ExperienceItem
                      key={index}
                      title={exp.title}
                      company={exp.company}
                      companyLinkedIn={exp.companyLinkedIn}
                      location={exp.location}
                      startDate={exp.startDate}
                      endDate={exp.endDate}
                      description={exp.description}
                      logoUrl={exp.logoUrl}
                    />
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Education */}
            {profile.education.length > 0 && (
              <ProfileSection
                id="education"
                title="Education"
                icon={GraduationCap}
                count={profile.education.length}
                openSection={openSection}
                onToggle={handleToggleSection}
              >
                <div className="space-y-0 pr-1">
                  {profile.education.map((edu, index) => (
                    <EducationItem
                      key={index}
                      institution={edu.institution}
                      institutionLinkedIn={edu.institutionLinkedIn}
                      degree={edu.degree}
                      fieldOfStudy={edu.fieldOfStudy}
                      startDate={edu.startDate}
                      endDate={edu.endDate}
                      grade={edu.grade}
                      description={edu.description}
                      logoUrl={edu.logoUrl}
                    />
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <ProfileSection
                id="certifications"
                title="Certifications"
                icon={Award}
                count={profile.certifications.length}
                openSection={openSection}
                onToggle={handleToggleSection}
              >
                <div className="space-y-0 pr-1">
                  {profile.certifications.map((cert, index) => (
                    <CertificationItem
                      key={index}
                      name={cert.name}
                      authority={cert.authority}
                      startDate={cert.startDate}
                      endDate={cert.endDate}
                      url={cert.url}
                    />
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <ProfileSection
                id="languages"
                title="Languages"
                icon={Languages}
                count={profile.languages.length}
                openSection={openSection}
                onToggle={handleToggleSection}
              >
                <div className="flex flex-wrap gap-2 pr-1">
                  {profile.languages.map((lang, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 text-xs"
                    >
                      <span className="font-medium">{lang.language}</span>
                      {lang.proficiency && (
                        <span className="text-muted-foreground">
                          ({lang.proficiency.replace(/_/g, " ").toLowerCase()})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Projects (from LinkedIn) */}
            {profile.linkedinData?.projects &&
              profile.linkedinData.projects.length > 0 && (
                <ProfileSection
                  id="projects"
                  title="Projects"
                  icon={FolderKanban}
                  count={profile.linkedinData.projects.length}
                  openSection={openSection}
                  onToggle={handleToggleSection}
                >
                  <div className="space-y-2 pr-1">
                    {profile.linkedinData.projects.map((project, index) => (
                      <div
                        key={index}
                        className="py-2 border-b border-border/30 last:border-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {project.url ? (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1"
                              >
                                {project.title}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <h4 className="font-medium text-sm text-foreground">
                                {project.title}
                              </h4>
                            )}
                            {project.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ProfileSection>
              )}

            {/* Volunteer Work (from LinkedIn) */}
            {profile.linkedinData?.volunteerWork &&
              profile.linkedinData.volunteerWork.length > 0 && (
                <ProfileSection
                  id="volunteer"
                  title="Volunteer"
                  icon={Heart}
                  count={profile.linkedinData.volunteerWork.length}
                  openSection={openSection}
                  onToggle={handleToggleSection}
                >
                  <div className="space-y-2 pr-1">
                    {profile.linkedinData.volunteerWork.map((vol, index) => (
                      <div
                        key={index}
                        className="py-2 border-b border-border/30 last:border-0"
                      >
                        <h4 className="font-medium text-sm text-foreground">
                          {vol.title}
                        </h4>
                        {vol.company && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {vol.company}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ProfileSection>
              )}

            </div>
        </div>
      </CardContent>
    </Card>
  )
}
