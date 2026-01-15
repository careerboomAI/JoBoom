/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better error catching
  reactStrictMode: true,

  // Disable Next.js Dev Tools UI (dev indicators overlay)
  devIndicators: false,
  
  images: {
    // Allow external images from job platforms
    remotePatterns: [
      { protocol: 'https', hostname: '**.licdn.com' },
      { protocol: 'https', hostname: '**.linkedin.com' },
      { protocol: 'https', hostname: '**.indeed.com' },
      { protocol: 'https', hostname: '**.behance.net' },
      { protocol: 'https', hostname: '**.upwork.com' },
      { protocol: 'https', hostname: 'pps.services.adobe.com' },
      { protocol: 'https', hostname: 'd2q79iu7y748jz.cloudfront.net' },
      { protocol: 'https', hostname: 'assets.enrichlayer.com' },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}

export default nextConfig
