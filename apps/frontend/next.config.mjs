/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { appDir: true },
  images: {
    remotePatterns: [
      // локальные медиа из Django
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      // CDN 999.md
      { protocol: "https", hostname: "i.simpalsmedia.com", pathname: "/**" }
    ],
    unoptimized: true
  }
}
export default nextConfig
