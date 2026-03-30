/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@reelo/ui", "@reelo/db"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
