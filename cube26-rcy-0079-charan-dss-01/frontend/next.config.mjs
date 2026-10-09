/** @type {import('next').NextConfig} */
const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const backendHost = rawApi.replace(/\/api\/v1\/?$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendHost}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
