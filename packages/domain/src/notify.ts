// PWA 알림 페이로드(IF-014 data의 코드 원천 · ADR-009) — 표시는 서비스 워커 showNotification 한 경로. 딥링크 URL 규칙은 notify.test.ts로 고정
import type { Alert, Severity } from './types';

export interface PushPayload {
  title: string;
  body: string;
  /** 클릭 딥링크(앱 내 경로) */
  url: string;
  /** 같은 업무의 알림은 갱신(중복 표시 방지) */
  tag: string;
  severity: Severity;
}
export type PushSurface = 'a1' | 'a2' | 'a3' | 'a4';
/** 알림 종류 라벨 — 페이로드 제목용 */
export const ALERT_KIND_LABEL: Record<Alert['kind'], string> = {
  comm: '통신',
  gps: 'GPS',
  voltage: '전압',
  harness: '단선',
  error: '고장코드',
  doc: '서류',
  pipe: '수송관',
  filter: '필터',
  'ai-person': 'AI 인원 접근',
  'camera-health': '카메라 상태',
};
/** 표면별 딥링크(specs/notifications AC-3): 현장 a1 → 업무 상세(업무 없으면 업무함) · 운전자 a2 → 오늘 · 본사 a3 → 현장 목록 · 사업주 a4 → 보유 현황 */
export function toPushPayload(alert: Alert, surface: PushSurface): PushPayload {
  const url =
    surface === 'a1'
      ? alert.caseId
        ? `/a1/inbox/${alert.caseId}`
        : '/a1/inbox'
      : surface === 'a2'
        ? '/a2/today'
        : surface === 'a3'
          ? '/a3/sites'
          : '/a4/fleet';
  return {
    title: `${alert.deviceId} · ${ALERT_KIND_LABEL[alert.kind]}`,
    body: alert.message,
    url,
    tag: alert.caseId ?? alert.id,
    severity: alert.severity,
  };
}
