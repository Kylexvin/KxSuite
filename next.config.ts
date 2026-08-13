import type { NextConfig } from "next";

type EslintConfig = {
  ignoreDuringBuilds?: boolean;
};

type ExtendedNextConfig = NextConfig & {
  eslint?: EslintConfig;
};

const nextConfig: ExtendedNextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // If you're using the app directory (which you are)
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
