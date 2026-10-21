import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => new Response(__SITE_URL_CONFIGURED__ ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${new URL('/sitemap.xml', site)}\n` : 'User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
