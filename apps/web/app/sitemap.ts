import { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL!;
const API = process.env.NEXT_PUBLIC_API_URL!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    const [productsRes, catsRes, pagesRes] = await Promise.all([
      fetch(`${API}/products?limit=500&status=active`),
      fetch(`${API}/categories`),
      fetch(`${API}/pages`),
    ]);

    const [products, categories, pages] = await Promise.all([
      productsRes.json(), catsRes.json(), pagesRes.json(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = (products.items || []).map((p: any) => ({
      url: `${BASE}/products/${p._id}`,
      lastModified: new Date(p.updatedAt || p.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((c: any) => ({
      url: `${BASE}/products?category=${c._id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const pageRoutes: MetadataRoute.Sitemap = (pages || []).map((p: any) => ({
      url: `${BASE}/pages/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...pageRoutes];
  } catch {
    return staticRoutes;
  }
}
