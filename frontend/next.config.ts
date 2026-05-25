import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, ".."),
  },
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "jsonwebtoken",
    "groq-sdk",
    "multer",
  ],
};

export default nextConfig;
