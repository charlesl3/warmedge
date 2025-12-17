import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://warmedge.vercel.app/",
      lastModified: new Date(),
    },
    {
      url: "https://warmedge.vercel.app/about",
      lastModified: new Date(),
    },
    {
      url: "https://warmedge.vercel.app/products",
      lastModified: new Date(),
    },
    {
      url: "https://warmedge.vercel.app/contact",
      lastModified: new Date(),
    },
  ];
}
