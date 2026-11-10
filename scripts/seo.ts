// Generates public/sitemap.xml and public/robots.txt from the same data the site renders.
// Run with Node >= 22.18 (native TypeScript type stripping).
import { writeFileSync } from 'node:fs';
import { MOVIES, SITE_URL, imgUrl } from '../src/app/data/catalog.ts';

const out = (f: string, s: string) => writeFileSync(new URL(`../public/${f}`, import.meta.url), s);
const today = new Date().toISOString().slice(0, 10);
const abs = (p: string) => (p.startsWith('http') ? p : `${SITE_URL}/${p.replace(/^\//, '')}`);

const pages = [
  { path: '/', prio: '1.0', images: [] as string[] },
  { path: '/cinemas/', prio: '0.6', images: [] },
  { path: '/bomboniere/', prio: '0.6', images: [] },
  ...MOVIES.map((m) => ({ path: `/filmes/${m.slug}/`, prio: m.status === 'now' ? '0.8' : '0.7', images: m.posterPath ? [imgUrl(m.posterPath, 'poster', true)] : [] })),
];

out(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.prio}</priority>
${p.images.map((i) => `    <image:image><image:loc>${abs(i)}</image:loc></image:image>`).join('\n')}
  </url>`.replace(/\n\n/g, '\n'),
  )
  .join('\n')}
</urlset>
`,
);

out('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`seo: sitemap.xml (${pages.length} urls), robots.txt`);
