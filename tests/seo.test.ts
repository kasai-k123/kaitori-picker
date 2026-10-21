import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { data } from '../src/lib/data';

test('SITE_URL設定・未設定の実ビルドでSEO出力を検証する', () => {
  const output = mkdtempSync(resolve('.seo-test-'));
  const paths = ['/', '/methodology/', '/privacy/', ...data.serviceRecords.map(s => s.detailPath)];
  try {
    for (const site of ['https://seo-test.example', '']) {
      execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', output], {
        env: { ...process.env, SITE_URL: site, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: 'pipe'
      });
      for (const path of paths) {
        const html = readFileSync(join(output, path, 'index.html'), 'utf8');
        if (site) {
          assert.ok(html.includes(`rel="canonical" href="${site}${path}"`));
          assert.ok(html.includes(`property="og:url" content="${site}${path}"`));
          assert.ok(html.includes('content="index, follow"'));
        } else {
          assert.ok(html.includes('content="noindex, follow"'));
          assert.ok(!html.includes('rel="canonical"'));
          assert.ok(!html.includes('property="og:url"'));
        }
      }
      assert.ok(readFileSync(join(output, '404.html'), 'utf8').includes('content="noindex, follow"'));
      const sitemap = readFileSync(join(output, 'sitemap.xml'), 'utf8');
      const robots = readFileSync(join(output, 'robots.txt'), 'utf8');
      if (site) {
        assert.equal((sitemap.match(/<loc>/g) || []).length, paths.length);
        for (const path of paths) assert.ok(sitemap.includes(`<loc>${site}${path}</loc>`));
        assert.equal(robots, `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${site}/sitemap.xml\n`);
      } else {
        assert.ok(!sitemap.includes('<loc>'));
        assert.equal(robots, 'User-agent: *\nDisallow: /\n');
      }
    }
  } finally { rmSync(output, { recursive: true, force: true }); }
});
