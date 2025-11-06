/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is enabled by default in Next.js 14
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
      'cdn.data.street.co.uk',
      'media.rightmove.co.uk',
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.appraisor.com',
          },
        ],
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
