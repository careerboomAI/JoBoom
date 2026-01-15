import { Github } from "lucide-react"
import Image from "next/image"

// X (Twitter) Logo Component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Image 
                src="/logo.svg" 
                alt="HireBoom Logo" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-foreground">JoBoom</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              An AI-powered job search platform that helps you find your dream job across multiple professional networks. Upload your CV or LinkedIn profile and discover opportunities instantly.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/JoBoom"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/CastelMaker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="lg:max-w-md">
            {/*
              NOTE: Newsletter / "Receive updates" is intentionally disabled for now.
              Keep this block around until we wire up a real subscription backend.
            */}
            {/*
            <h3 className="font-semibold text-foreground mb-4">Receive updates</h3>
            <p className="text-sm text-muted-foreground mb-4">
              JoBoom is currently in Alpha. Subscribe to receive updates about new features and improvements.
            </p>
            <div className="flex gap-2 mb-6">
              <Input
                type="email"
                placeholder="Your email..."
                className="flex-1 border-2 dark:border-white/10"
              />
              <Button size="icon" className="shrink-0">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
            */}
            <a
              href="https://www.careerboom.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 p-4 bg-background border-2 border-border dark:border-white/10 rounded-lg hover:border-primary dark:hover:border-primary transition-colors group"
            >
              <Image
                src="/careerboom.png"
                alt="CareerBoom Logo"
                width={40}
                height={40}
                className="w-10 h-10 dark:invert-0 invert"
              />
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  Looking for a job?
                </p>
                <p className="text-sm text-muted-foreground">
                  Try CareerBoom, the interlligent AI toolkit for your career!
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border dark:border-white/10 mt-8 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            Made with{" "}
            <span className="text-red-500">❤️</span>{" "}
            for better job searching by{" "}
            <a
              href="https://x.com/CastelMaker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Castel
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

