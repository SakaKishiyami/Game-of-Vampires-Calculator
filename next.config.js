/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript and ESLint errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Remove static export to enable API routes
  // output: 'export', // This prevents API routes from working
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig