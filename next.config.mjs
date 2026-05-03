/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '185f270b-6904-433b-b56b-20c03964881f-00-1hak2mielyfvy.worf.replit.dev',
  ],
}

export default nextConfig
