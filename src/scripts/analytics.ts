type EventName = 'page_view' | 'comparison_interaction' | 'service_detail_view' | 'outbound_click';
export function track(event: EventName, course = '') {
  if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const body = JSON.stringify({ event, path: location.pathname, service: document.body.dataset.serviceId || '', course });
  // Keep navigation independent from analytics availability.
  try {
    void fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* Analytics must not interrupt comparison or navigation. */ }
}
if (typeof document !== 'undefined') {
  track('page_view');
  if (document.body.dataset.serviceId) track('service_detail_view');
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-outbound]') : null;
    if (target) track('outbound_click', target.dataset.outbound);
  });
}
