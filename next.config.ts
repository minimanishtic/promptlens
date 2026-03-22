import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d8j0ntlcm91z4.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d2ol7oe51mr4n9.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-92229c269d9a42b8b713d27323e857f7.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
