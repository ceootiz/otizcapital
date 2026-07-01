import type { MetadataRoute } from "next";
import { locales } from "@otiz/lib";

const BASE_URL = "https://otiz-capital-web.vercel.app";

const ROUTES = ["apply", "calculator", "legal", "about", "contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1
    }
  ];

  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1
    });

    for (const route of ROUTES) {
      entries.push({
        url: `${BASE_URL}/${locale}/${route}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.7
      });
    }
  }

  return entries;
}
