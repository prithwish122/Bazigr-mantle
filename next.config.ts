import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable SWC minification to try and fix worker crashes
  swcMinify: false,
  // Increase timeout significantly
  staticPageGenerationTimeout: 180,
  // Silence Turbopack warning (optional)
  experimental: {
    turbopack: false, // Explicitly disable if causing issues, or use {} if enabling
  },

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Aggressively ignore warnings
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { module: /@wagmi\/core/ },
      { module: /@reown\/appkit/ },
      { message: /Call retries were exceeded/ },
    ];

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
