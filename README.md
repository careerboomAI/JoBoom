<p align="center">
  <img src="public/logo.svg" alt="JoBoom Logo" width="80" height="80" />
</p>

<h1 align="center">JoBoom</h1>

<p align="center">
  <strong>AI-powered job search platform</strong> that helps you find your dream job across multiple professional networks.
  <br /><br />
  Upload your CV or LinkedIn profile and let AI discover relevant opportunities on LinkedIn, Indeed, Upwork, Behance, and Freelance.com — all in one place.
</p>

---

## ✨ Features

- **Multi-platform Search** — Search jobs across LinkedIn, Indeed, Upwork, Behance, and Freelance.com simultaneously
- **CV Parsing** — Upload your CV (PDF, DOCX, TXT) and AI extracts your skills, experience, and qualifications
- **LinkedIn Profile Import** — Fetch your LinkedIn profile data automatically
- **AI-powered Query Generation** — AI optimizes search queries based on your profile and preferences
- **Smart Source Selection** — "Auto" mode lets AI choose the best platforms for your job type
- **Unified Results** — View all job opportunities in a consistent, easy-to-browse interface

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui + Radix UI |
| **Icons** | Iconify + Lucide |
| **AI** | OpenAI GPT-4o-mini |
| **Job Data** | Apify (LinkedIn, Upwork, Indeed, Behance, Freelance.com scrapers) |
| **Profile Data** | EnrichLayer (LinkedIn profiles) |
| **File Parsing** | unpdf (PDF), mammoth (DOCX) |

---

## 📋 Prerequisites

- **Node.js** 18.17+ (LTS recommended)
- **npm** or **pnpm**
- API keys for:
  - [OpenAI](https://platform.openai.com/) — for AI query generation and CV parsing
  - [Apify](https://apify.com/) — for job scraping
  - [EnrichLayer](https://enrichlayer.com/) — for LinkedIn profile fetching

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/joboom.git
cd joboom
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
# Required API Keys (server-side only - never prefix with NEXT_PUBLIC_)
OPENAI_API_KEY=sk-...
APIFY_API_TOKEN=apify_api_...
ENRICHLAYER_API_KEY=...

# Optional: for production deployments
INTERNAL_API_URL=https://your-domain.com
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── create-search-query/   # AI query generation endpoints
│   │   │   ├── linkedin/
│   │   │   ├── upwork/
│   │   │   ├── indeed/
│   │   │   ├── behance/
│   │   │   └── freelance/
│   │   ├── job-search/            # Job search execution endpoints
│   │   │   ├── linkedin/
│   │   │   ├── upwork/
│   │   │   ├── indeed/
│   │   │   ├── behance/
│   │   │   └── freelance/
│   │   ├── linkedin-profile/      # LinkedIn profile fetching
│   │   ├── parse-cv/              # CV parsing with AI
│   │   └── select-sources/        # AI source selection
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Main application page
├── components/
│   ├── ui/                        # shadcn/ui primitives (button, card, etc.)
│   ├── job-card.tsx               # LinkedIn job card
│   ├── upwork-job-card.tsx        # Upwork job card
│   ├── indeed-job-card.tsx        # Indeed job card
│   ├── behance-job-card.tsx       # Behance job card
│   ├── freelance-job-card.tsx     # Freelance.com job card
│   ├── job-grid.tsx               # Job results grid
│   ├── search-bar.tsx             # Search input with filters
│   ├── footer.tsx                 # App footer
│   └── theme-toggle.tsx           # Dark/light mode toggle
├── hooks/
│   └── use-toast.ts               # Toast notification hook
├── lib/
│   └── utils.ts                   # Utility functions (cn helper)
├── types/
│   ├── cv.ts                      # CV data types
│   ├── user-profile.ts            # Unified user profile
│   ├── enrichlayer_linkedin_profile.ts  # LinkedIn API types
│   ├── linkedin_job_search.ts     # LinkedIn job types
│   ├── upwork_job_search.ts       # Upwork job types
│   ├── indeed_job_search.ts       # Indeed job types
│   ├── behance_job_search.ts      # Behance job types
│   └── freelance_job_search.ts    # Freelance.com job types
└── public/
    ├── logo.svg                   # App logo
    └── careerboom.png             # Partner logo
```

---

## 🔒 Security

- All API keys are **server-side only** (no `NEXT_PUBLIC_` prefix)
- Security headers configured (X-Frame-Options, XSS protection, etc.)
- Input sanitization for user-provided data
- File upload validation (size limits, type checking)
- LinkedIn URL validation with regex

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |


---

## 👨‍💻 Author

Made with ❤️ by [Castel](https://x.com/CastelMaker)

🔗 [CareerBoom.ai](https://www.careerboom.ai) — The intelligent AI toolkit for your career

