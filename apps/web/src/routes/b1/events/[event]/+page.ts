// B1-08 이벤트 복기(W2 구조) — event_id로 4레인 메타 · 없으면 404 EmptyState(에러 페이지 대신 화면이 그린다) (specs/event-replay AC-1 · AC-3)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, url }) => {
  const { api } = await parent();
  const scope = { role: 'control' as const };
  const [event, devices, cameras, alerts, cases] = await Promise.all([
    api.event(params.event),
    api.devices(scope),
    api.cameras(),
    api.alerts(scope),
    api.cases(scope),
  ]);
  return {
    id: params.event,
    // 진입 커서(초) — 캡처·e2e 결정성(B1-08:pinned = ?cursor=-12). 슬라이더·키 조작은 URL을 건드리지 않는다
    cursor: Number(url.searchParams.get('cursor')) || 0,
    event: event ?? null,
    device: event ? (devices.find((d) => d.id === event.deviceId) ?? null) : null,
    cameras,
    alert: event ? (alerts.find((a) => a.id === event.alertId) ?? null) : null,
    task: event?.caseId ? (cases.find((c) => c.id === event.caseId) ?? null) : null,
  };
};
