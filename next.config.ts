import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // The voucher PNG route reads TTF files from disk at request time. Serverless
  // bundlers only trace `import`ed files, so these must be declared or the
  // route fails in production with ENOENT.
  outputFileTracingIncludes: {
    "/v/[slug]/image": ["./src/assets/fonts/**"],
  },
};

export default nextConfig;
