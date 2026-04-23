import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "jusrfiiboybrhaocqjdj.supabase.co" },
      { protocol: "https", hostname: "vcdn.jobsgo.vn" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "vinhomes.vn" },
      { protocol: "https", hostname: "vinadesign.vn" },
      { protocol: "https", hostname: "vcdn1-kinhdoanh.vnecdn.net" },
      { protocol: "https", hostname: "vnpt.com.vn" },
      { protocol: "https", hostname: "masangroup.com" },
      { protocol: "https", hostname: "masanhightechmaterials.com" },
      { protocol: "https", hostname: "viettelpost.com.vn" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
