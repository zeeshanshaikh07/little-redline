import type { MetadataRoute } from "next";
import { getPublishedProducts } from "../lib/products";

const siteUrl = "https://little-redline.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublishedProducts();

  return [
    { url: `${siteUrl}/` },
    ...products.map((product) => ({
      url: `${siteUrl}/cars/${encodeURIComponent(product.id)}`,
    })),
  ];
}
