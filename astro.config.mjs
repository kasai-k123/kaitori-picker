import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
const site = (process.env.SITE_URL ?? env.SITE_URL ?? '').trim();
const url = site ? new URL(site) : undefined;
if (url && (!['https:', 'http:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash)) {
  throw new Error('SITE_URL must be an absolute HTTP(S) origin');
}
export default defineConfig({
  site: url?.origin, output: 'static', trailingSlash: 'always',
  vite: { define: { __SITE_URL_CONFIGURED__: JSON.stringify(Boolean(url)) } }
});
