import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import mammoth from "mammoth"
import { extractText as extractPdfText } from "unpdf"
import { CVData } from "@/types/cv"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper to extract text from file buffer
async function extractText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    try {
      const { text } = await extractPdfText(new Uint8Array(arrayBuffer))
      // text is an array of strings (one per page), join them
      return Array.isArray(text) ? text.join("\n") : text
    } catch (e) {
      console.error("PDF Parse Error:", e)
      throw new Error("Failed to parse PDF")
    }
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
    file.name.endsWith(".docx")
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch (e) {
      console.error("Word Parse Error:", e)
      throw new Error("Failed to parse Word document")
    }
  } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    return buffer.toString("utf-8")
  } else {
    throw new Error(`Unsupported file type: ${file.type}`)
  }
}

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed MIME types
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    // File type validation (check both MIME type and extension)
    const isValidType = ALLOWED_TYPES.includes(file.type) || 
      file.name.endsWith(".pdf") || 
      file.name.endsWith(".docx") || 
      file.name.endsWith(".doc") || 
      file.name.endsWith(".txt")
    
    if (!isValidType) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF, Word, or TXT files." },
        { status: 400 }
      )
    }

    console.log("Processing file:", file.name, file.type, file.size)
    const text = await extractText(file)
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 })
    }

    const prompt = `
      You are an expert CV parser. Extract the following information from the CV text provided below and return it as a valid JSON object matching the structure.
      
      Structure:
      {
        "personalInfo": { 
          "name": "string", 
          "surname": "string", 
          "headline": "string | null", 
          "gender": "string | null", 
          "currentLocation": "string | null", 
          "birthDate": "string | null" 
        },
        "careerSummary": "string | null",
        "contacts": { 
          "email": "string | null", 
          "phone": "string | null", 
          "linkedin": "string | null", 
          "website": "string | null", 
          "other": ["string"] 
        },
        "skills": ["string"],
        "licensesAndCertifications": [{ 
          "name": "string", 
          "issuer": "string | null", 
          "issueDate": "string | null", 
          "expirationDate": "string | null", 
          "credentialId": "string | null", 
          "credentialUrl": "string | null" 
        }],
        "workExperience": [{ 
          "title": "string", 
          "company": "string", 
          "location": "string | null", 
          "startDate": "string | null", 
          "endDate": "string | null", 
          "description": "string | null", 
          "skillsUsed": ["string"] 
        }],
        "education": [{ 
          "institution": "string", 
          "degree": "string | null", 
          "fieldOfStudy": "string | null", 
          "startDate": "string | null", 
          "endDate": "string | null", 
          "grade": "string | null", 
          "description": "string | null" 
        }],
        "languages": [{ 
          "language": "string", 
          "proficiency": "string | null" 
        }]
      }

      Instructions:
      1. Extract Name and Surname from the top of the resume.
      2. Extract contacts carefully.
      3. For dates, use "YYYY-MM" format if possible, or "YYYY".
      4. If a field is not found, use null.
      5. Do not hallucinate information. Only extract what is present.
      
      CV Text:
      ${text.substring(0, 15000)}
    `

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a precise CV parsing assistant. Output valid JSON only." },
        { role: "user", content: prompt }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.1,
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error("No content received from AI")
    }

    const parsedData = JSON.parse(content) as CVData

    // Log the parsed CV data for debugging
    console.log("\n========== PARSED CV DATA ==========")
    console.log(JSON.stringify(parsedData, null, 2))
    console.log("=====================================\n")

    return NextResponse.json({ data: parsedData })

  } catch (error: any) {
    console.error("CV Parsing Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to parse CV" },
      { status: 500 }
    )
  }
}
