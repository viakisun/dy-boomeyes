// mock RealtimeClient — 알림을 대본대로 재생한다 (demo-scripts 장면 1 · specs/control-dashboard AC-3). capture 모드에서는 발행하지 않는다(결정성).
import type { Alert, RealtimeClient, RealtimeEvent } from '@boomeyes/domain';
import { clock } from './clock';

const SCRIPT: Omit<Alert, 'id' | 'at' | 'acked'>[] = [
  {
    deviceId: 'CPB-003',
    kind: 'ai-person',
    severity: 'warning',
    message: 'CPB-003 호스 주변 인원 접근 (AI 판단)',
    caseId: 'C-105',
  },
  {
    deviceId: 'CPB-002',
    kind: 'pipe',
    severity: 'warning',
    message: 'CPB-002 수송관 도달률 97% — 점검 권고',
    caseId: null,
  },
  {
    deviceId: 'CPB-004',
    kind: 'comm',
    severity: 'critical',
    message: 'CPB-004 통신 두절 지속 (LWT 재수신 없음)',
    caseId: null,
  },
];

export function createMockRealtime(
  opts: { enabled?: boolean; firstMs?: number; intervalMs?: number } = {},
): RealtimeClient {
  const { enabled = true, firstMs = 6_000, intervalMs = 15_000 } = opts;
  return {
    subscribe(handler: (event: RealtimeEvent) => void) {
      if (!enabled || typeof window === 'undefined') return () => {};
      let n = 0;
      const fire = () => {
        const s = SCRIPT[n % SCRIPT.length];
        if (!s) return;
        n++;
        handler({
          type: 'alert.raised',
          alert: { ...s, id: `AL-L${String(n).padStart(2, '0')}`, at: clock.iso(), acked: false },
        });
      };
      const first = setTimeout(fire, firstMs);
      const every = setInterval(fire, intervalMs);
      return () => {
        clearTimeout(first);
        clearInterval(every);
      };
    },
  };
}
