import type { APIRoute } from 'astro';
import { data } from '../lib/data';
export const GET: APIRoute = ({ site }) => {
  const paths = __SITE_URL_CONFIGURED__ ? ['/', '/methodology/', '/privacy/', ...data.serviceRecords.map(s => s.detailPath)] : [];
  const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escape(new URL(path, site).href)}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
