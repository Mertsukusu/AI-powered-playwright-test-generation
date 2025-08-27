/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GENERATOR_URL: process.env.NEXT_PUBLIC_GENERATOR_URL,
  },
}

module.exports = nextConfig
