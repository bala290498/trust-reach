/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Enable experimental features for better caching
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig

