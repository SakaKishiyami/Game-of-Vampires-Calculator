/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript and ESLint errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable static export for better compatibility
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig