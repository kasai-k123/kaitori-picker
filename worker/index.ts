import data from '../src/data/kaitori-official-data-2026-10-21.json';
export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  EVENTS?: { writeDataPoint(point: { indexes: string[]; blobs: string[]; doubles: number[] }): void };
}
const paths = new Set(['/', '/methodology/', '/privacy/', ...data.serviceRecords.map(s => s.detailPath)]);
const events = new Set(['page_view', 'comparison_interaction', 'service_detail_view', 'outbound_click']);
const response = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
export async function handleEvents(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  if (request.headers.get('Origin') !== new URL(request.url).origin) return response(403);
  if (request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return response(204);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return response(415);
  // Limit the streamed body, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return response(400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1024) { await reader.cancel(); return response(413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let payload: unknown;
  try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { return response(400); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return response(400);
  const p = payload as Record<string, unknown>;
  if (Object.keys(p).some(key => !['event', 'path', 'service', 'course'].includes(key))) return response(400);
  if (typeof p.event !== 'string' || !events.has(p.event) || typeof p.path !== 'string' || !paths.has(p.path)) return response(400);
  const service = data.serviceRecords.find(s => s.detailPath === p.path)?.id || '';
  if (p.service !== service || typeof p.course !== 'string') return response(400);
  if (p.event === 'comparison_interaction' && p.path !== '/') return response(400);
  if (p.event === 'service_detail_view' && !service) return response(400);
  if (p.event === 'outbound_click') {
    const course = data.courses.find(c => c.id === p.course);
    if (!course || (p.path !== '/' && course.serviceId !== service)) return response(400);
  } else if (p.course !== '') return response(400);
  if (!env.EVENTS) return response(503);
  try { env.EVENTS.writeDataPoint({ indexes: ['kaitori-picker'], blobs: [p.event, p.path, service, p.course], doubles: [1] }); }
  catch { return response(503); }
  return response(204);
}
export default {
  async fetch(request: Request, env: Env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/events') return handleEvents(request, env);
    if (path.startsWith('/api/')) return response(404);
    return env.ASSETS.fetch(request);
  }
};
