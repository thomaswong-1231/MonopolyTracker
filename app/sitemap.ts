import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/setup`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/properties`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/history`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/settings`, lastModified: now, changeFrequency: "monthly", priority: 0.5 }
  ];
}
