import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const rawBackend =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.INTERNAL_BACKEND_HOST
        ? `http://${process.env.INTERNAL_BACKEND_HOST}:${process.env.INTERNAL_BACKEND_PORT || "5000"}`
        : "http://localhost:5000");

    const backendUrl = rawBackend.startsWith("http")
      ? rawBackend.replace(/\/api\/?$/, "")
      : `http://${rawBackend}`.replace(/\/api\/?$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

