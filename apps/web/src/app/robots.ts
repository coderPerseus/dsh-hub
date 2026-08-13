import type { MetadataRoute } from "next";

import { absoluteUrl, siteUrl } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteUrl.origin,
    rules: { allow: "/", userAgent: "*" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
