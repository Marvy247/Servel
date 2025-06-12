/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable experimental features
  experimental: {
    turbo: {
      loaders: {
        '.css': ['style-loader', 'css-loader'],
      },
    },
    optimizeCss: true,
  },
  // Configure API proxy to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*'
      }
    ]
  },
  // Performance optimizations
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Enable output file tracing for better analysis
  outputFileTracing: true,
  // Disable source maps in production
  productionBrowserSourceMaps: false
}

module.exports = nextConfig
