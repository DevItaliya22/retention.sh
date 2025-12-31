/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@reelo/ui", "@reelo/db"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
