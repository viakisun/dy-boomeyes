// 소유주 활동 시뮬레이터 — 시연 중 함대가 살아 움직이게 한다(수신 시각 전진 · 전압 지터 · 수신 지연/고장/점검 발생·해소 · 카메라 가용 토글 · 새 알림).
// 결정적 PRNG(mulberry32, 고정 seed) + 틱 번호로만 결정된다 — 같은 시작이면 같은 순서. 보관 ↔ 투입 전환은 하지 않는다(재고 축은 시뮬레이션 대상이 아니다).
import type { OwnerAlert, OwnerDevice, OwnerSnapshot } from '@boomeyes/domain';
import { clock } from './clock';

export const SIM_TICK_MS = 5000;
export const SIM_SEED = 20260912;
const ERROR_CODES = ['E-021', 'E-107', 'E-044'] as const;
const FAULTS: Record<(typeof ERROR_CODES)[number], string> = {
  'E-021': '공급 전압 저하',
  'E-107': '유압 압력 이상',
  'E-044': '붐 각도 센서 이상',
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface OwnerSim {
  /** 한 틱 진행 — 바뀐 장비 id 목록. 타이머 없이 직접 호출할 수 있다(테스트·시연 점프) */
  tick(): string[];
  start(): void;
  stop(): void;
  readonly running: boolean;
  readonly ticks: number;
}

/** source를 제자리에서 바꾼다(API 경계의 structuredClone은 그대로). onchange는 틱마다 한 번 */
export function createOwnerSim(
  source: OwnerSnapshot,
  onchange: () => void,
  options: { seed?: number; tickMs?: number; setTimer?: typeof setInterval; clearTimer?: typeof clearInterval } = {},
): OwnerSim {
  const rand = mulberry32(options.seed ?? SIM_SEED);
  const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
  let ticks = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const alert = (d: OwnerDevice, kind: OwnerAlert['kind'], title: string, detail: string): OwnerAlert => ({
    id: `${d.id}-${kind.toUpperCase()}-${ticks}`,
    deviceId: d.id,
    kind,
    title,
    detail,
    at: clock.iso(),
    read: false,
  });
  function tick() {
    ticks++;
    const now = clock.iso();
    const changed: string[] = [];
    const live = source.devices.filter((d) => d.deployment === 'deployed' && d.connection === 'current');
    // 수신 중 장비: 수신 시각 전진 + 전압 지터(±3 V, 고장 장비는 낮은 값 유지)
    for (const d of live) {
      d.receivedAt = now;
      if (d.voltage !== null && !d.fault) d.voltage = 380 + Math.round((rand() - 0.5) * 6);
      // 지표도 함께 움직인다 — 전압은 장비 축의 값을 그대로 읽는다(두 곳이 갈리지 않게)
      d.telemetry.voltageV = d.voltage;
      if (d.telemetry.hydraulicBar !== null) d.telemetry.hydraulicBar = 210 + Math.round((rand() - 0.5) * 20);
      if (d.telemetry.oilTempC !== null) d.telemetry.oilTempC = 58 + Math.round((rand() - 0.5) * 10);
      if (d.telemetry.boomAngleDeg !== null) d.telemetry.boomAngleDeg = Math.round(rand() * 90) - 30;
    }
    source.at = now;
    // 첫 틱과 매 3틱째는 반드시 한 건 — 시연에서 5초 안에 무언가가 보인다
    const forced = ticks % 3 === 1;
    const roll = rand();
    if (forced || roll < 0.12) {
      const candidates = live.filter((d) => !d.fault && !d.inspection);
      const d = pick(candidates);
      if (d) {
        const kind = rand();
        if (kind < 0.5) {
          d.connection = 'stale';
          d.harness = rand() < 0.3 ? 'disconnected' : 'ok';
          source.alerts.unshift(
            alert(
              d,
              'connection',
              '수신 지연',
              d.harness === 'disconnected'
                ? '마지막 수신 이후 새 자료가 없고 단선이 감지됐습니다. 통신선과 현장 상태를 확인하세요.'
                : '마지막 수신 이후 새 자료가 없습니다. 통신과 현장 상태를 확인하세요.',
            ),
          );
        } else if (kind < 0.8) {
          const code = pick(ERROR_CODES)!;
          d.fault = FAULTS[code];
          d.errorCode = code;
          if (code === 'E-021') d.voltage = 342;
          source.alerts.unshift(
            alert(
              d,
              'fault',
              d.fault,
              code === 'E-021'
                ? `마지막 측정 ${d.voltage} V · 시연 기준 380 V · 고장코드 ${code}. 현장 전원 상태를 담당자에게 확인하세요.`
                : `${d.fault} · 고장코드 ${code}. 현장 담당자에게 확인하세요.`,
            ),
          );
        } else {
          d.inspection = '수송관 점검 시기 도래';
          const part = d.parts.find((p) => p.name === '수송관');
          if (part) Object.assign(part, { measured: '누적 타설량 9,600 m³', due: true });
          source.alerts.unshift(
            alert(
              d,
              'inspection',
              d.inspection,
              '누적 타설량 9,600 m³ · 점검 시연 기준 9,500 m³. 실제 교체 판정은 현장 점검이 필요합니다.',
            ),
          );
        }
        changed.push(d.id);
      }
    }
    // 해소: 시뮬레이터가 만든 지연·고장은 낮은 확률로 복구(페르소나 사실 002·003·004는 건드리지 않는다)
    for (const d of source.devices) {
      if (['CPB-002', 'CPB-003', 'CPB-004'].includes(d.id)) continue;
      if (d.connection === 'stale' && rand() < 0.15) {
        d.connection = 'current';
        d.harness = 'ok';
        d.receivedAt = now;
        changed.push(d.id);
      } else if (d.fault && rand() < 0.08) {
        d.fault = null;
        d.errorCode = null;
        d.voltage = 380;
        changed.push(d.id);
      }
    }
    // 카메라 가용 = 수신 중
    for (const c of source.cameras) {
      const d = source.devices.find((x) => x.id === c.deviceId);
      if (d) c.available = d.connection === 'current';
    }
    onchange();
    return changed;
  }
  const setTimer = options.setTimer ?? setInterval;
  const clearTimer = options.clearTimer ?? clearInterval;
  return {
    tick,
    start() {
      if (timer !== undefined) return;
      timer = setTimer(tick, options.tickMs ?? SIM_TICK_MS);
    },
    stop() {
      if (timer === undefined) return;
      clearTimer(timer);
      timer = undefined;
    },
    get running() {
      return timer !== undefined;
    },
    get ticks() {
      return ticks;
    },
  };
}
