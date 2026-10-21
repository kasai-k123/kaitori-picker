import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleEvents, type Env } from '../worker/index';
const origin = 'https://kaitori-picker.websl.workers.dev';
const payload = { event: 'page_view', path: '/', service: '', course: '' };
const request = (body: unknown, headers: Record<string, string> = {}) => new Request(`${origin}/api/events`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
const env = (): Env => ({ ASSETS: { fetch: async () => new Response('asset') }, EVENTS: { writeDataPoint: () => {} } });
test('4種類のイベントを固定スキーマで記録する', async () => {
  const points: unknown[] = [];
  const bindings = env(); bindings.EVENTS = { writeDataPoint: point => points.push(point) };
  for (const body of [payload, { ...payload, event: 'comparison_interaction' }, { ...payload, event: 'service_detail_view', path: '/services/netoff/', service: 'netoff' }, { ...payload, event: 'outbound_click', course: 'netoff/books-games' }]) assert.equal((await handleEvents(request(body), bindings)).status, 204);
  assert.equal(points.length, 4);
  assert.deepEqual(points[0], { indexes: ['kaitori-picker'], blobs: ['page_view', '/', '', ''], doubles: [1] });
});
test('外部origin、不正イベント、任意URL・自由入力を拒否する', async () => {
  assert.equal((await handleEvents(request(payload, { Origin: 'https://other.example' }), env())).status, 403);
  for (const body of [{ ...payload, event: 'arbitrary' }, { ...payload, path: '/?email=private' }, { ...payload, email: 'private' }, { ...payload, service: 'netoff' }, { ...payload, event: 'outbound_click', course: 'invalid' }, { ...payload, event: 'service_detail_view' }, { ...payload, event: 'comparison_interaction', path: '/privacy/' }]) assert.equal((await handleEvents(request(body), env())).status, 400);
});
test('大きいボディ、壊れたJSON、POST以外を拒否する', async () => {
  assert.equal((await handleEvents(request({ data: 'x'.repeat(1025) }), env())).status, 413);
  const broken = new Request(`${origin}/api/events`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{' });
  assert.equal((await handleEvents(broken, env())).status, 400);
  assert.equal((await handleEvents(new Request(`${origin}/api/events`), env())).status, 405);
});
test('計測停止設定を尊重し、bindingがない場合を識別できる', async () => {
  const bindings = env(); bindings.EVENTS = { writeDataPoint: () => assert.fail('must not write') };
  const privacyHeaders: Record<string, string>[] = [{ DNT: '1' }, { 'Sec-GPC': '1' }];
  for (const headers of privacyHeaders) assert.equal((await handleEvents(request(payload, headers), bindings)).status, 204);
  assert.equal((await handleEvents(request(payload), { ASSETS: env().ASSETS })).status, 503);
});
test('通常ページはassetsへ、未知のAPIは404', async () => {
  assert.equal(await (await worker.fetch(new Request(origin), env())).text(), 'asset');
  assert.equal((await worker.fetch(new Request(`${origin}/api/other`), env())).status, 404);
});
