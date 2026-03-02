/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return {
      // fallback: only matches if NO filesystem route handled the request.
      // /api/auth/[...nextauth] is a filesystem route -> handled by Next.js.
      // All other /api/* requests have no filesystem route -> proxied to backend.
      fallback: [
        {
          source: "/api/:path*",
          destination: `${process.env.BACKEND_URL || "http://localhost:8001"}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
