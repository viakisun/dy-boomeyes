// 현장 프로파일 → 피처 플래그 (ssot options.profiles P-LITE/P-SD/P-NVR · DISC-028). 화면은 이 플래그만 본다 (specs/video-basics design).
import ssot from './generated/ssot.json';
import type { VideoProfile } from './types';

export type StorageSource = 'server' | 'sd' | 'nvr';

export interface ProfileFlags {
  profile: VideoProfile;
  /** AX-1 카메라 채널 수 */
  channels: 1 | 2;
  /** AX-4 저장 소스 탭 — 선택지 문구 그대로(서버 서브스트림 → server · SD 병행 → sd · 소형 NVR → nvr) */
  sources: StorageSource[];
  /** SD 병행 프로파일만 구간 회수 버튼 */
  sdRecall: boolean;
  /** NVR 프로파일만 타임라인 자리 */
  nvrTimeline: boolean;
  /** 스냅샷 채널 갱신 주기 — 라이트 10s · 그 외 5s */
  snapshotEveryMs: number;
  /** AX-2 이벤트 수신 경로 · AX-3 라이브 경로 · AX-6 바디캠 · AX-8 텔레메트리 발행 */
  eventRoute: string;
  liveRoute: string;
  bodycam: string | null;
  telemetry: string;
}

interface ProfileRow {
  id: string;
  name: string;
  choices: Record<string, string | null>;
}
const PROFILES = (ssot as { options: { profiles: ProfileRow[] } }).options.profiles;

/** 프로파일 ID → 플래그. 없는 프로파일이면 Error (mock 시드·폼은 ssot 목록만 쓴다) */
export function profileFlags(profile: VideoProfile): ProfileFlags {
  const row = PROFILES.find((p) => p.id === profile);
  if (!row) throw new Error(`알 수 없는 현장 프로파일: ${profile}`);
  const storage = row.choices['AX-4'] ?? '';
  const sources: StorageSource[] = [];
  if (storage.includes('서버')) sources.push('server');
  if (storage.includes('SD')) sources.push('sd');
  if (storage.includes('NVR')) sources.push('nvr');
  if (!sources.length) throw new Error(`AX-4 저장 선택지 해석 불가: ${storage}`);
  return {
    profile,
    channels: (row.choices['AX-1'] ?? '').startsWith('1') ? 1 : 2,
    sources,
    sdRecall: sources.includes('sd'),
    nvrTimeline: sources.includes('nvr'),
    snapshotEveryMs: profile === 'P-LITE' ? 10_000 : 5_000,
    eventRoute: row.choices['AX-2'] ?? 'E1',
    liveRoute: row.choices['AX-3'] ?? 'L1',
    bodycam: row.choices['AX-6'] ?? null,
    telemetry: row.choices['AX-8'] ?? 'T1',
  };
}

export const PROFILE_IDS = PROFILES.map((p) => p.id as VideoProfile);

/** 옵션 8축(ssot options.axes) — id·이름 */
export const PROFILE_AXES = (ssot as { options: { axes: { id: string; name: string }[] } }).options.axes.map((a) => ({
  id: a.id,
  name: a.name,
}));
export interface ProfileAxis {
  id: string;
  name: string;
  /** 프리셋의 선택지 — null이면 없음(예: P-LITE 바디캠) */
  choice: string | null;
}
/** 프리셋의 8축 선택지 — B4-03 표시 전용(축 편집은 W4 · FR-029) */
export function profileAxes(profile: VideoProfile): ProfileAxis[] {
  const row = PROFILES.find((p) => p.id === profile);
  if (!row) throw new Error(`알 수 없는 현장 프로파일: ${profile}`);
  return PROFILE_AXES.map((a) => ({ ...a, choice: row.choices[a.id] ?? null }));
}
