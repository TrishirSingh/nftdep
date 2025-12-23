/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.infura.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'opensea.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.opensea.io',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
