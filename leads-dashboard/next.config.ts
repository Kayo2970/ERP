import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.1.3:3000',
    '192.168.1.3',
    '*.local',
  ],
};

export default nextConfig;
