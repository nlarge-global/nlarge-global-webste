export async function GET() {
  const baseUrl = 'https://nlargecorp.com' 
  
  const fixedLastModified = "2025-09-15T00:00:00Z"; 
  const routes = [
    {
      url: baseUrl,
      lastModified: fixedLastModified,
      changeFrequency: 'weekly',
      priority: '1.0',
    },
    {
      url: `${baseUrl}/products`,
      lastModified: fixedLastModified,
      changeFrequency: 'monthly',
      priority: '0.8',
    },
    {
      url: `${baseUrl}/services`,
      lastModified: fixedLastModified,
      changeFrequency: 'monthly',
      priority: '0.8',
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: fixedLastModified,
      changeFrequency: 'monthly',
      priority: '0.7',
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: fixedLastModified,
      changeFrequency: 'yearly',
      priority: '0.3',
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: fixedLastModified,
      changeFrequency: 'yearly',
      priority: '0.3',
    },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map(
      (route) => `
  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastModified}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join('')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}