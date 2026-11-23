/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // "standalone" is for self-hosted Docker/VPS deployments.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;
