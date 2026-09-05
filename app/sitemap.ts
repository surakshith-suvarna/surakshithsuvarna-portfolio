import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://surakshithsuvarna.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-09-05"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/case-studies/unified-it-operations-dashboard`,
      lastModified: new Date("2026-09-05"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/case-studies/3cx-post-call-analytics`,
      lastModified: new Date("2026-08-30"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/case-studies/microsoft-teams-insights`,
      lastModified: new Date("2026-08-30"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/case-studies/primary-datacentre-migration`,
      lastModified: new Date("2026-08-30"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
