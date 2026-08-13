import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dshhub/contracts"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
