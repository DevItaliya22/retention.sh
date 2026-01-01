/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@reelo/ui", "@reelo/db"],
  reactCompiler: true,
};

export default nextConfig;
