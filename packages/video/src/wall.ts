// 현장 프로파일 AX-1: 1채널(P-LITE)이면 AI 채널을 숨긴다 (video-basics design · profileFlags.channels) — 월·모달 딥링크 가드가 같은 규칙을 쓴다
import { profileFlags, type Camera, type Device, type Site } from '@boomeyes/domain';

export const visibleIn = (c: Camera, devices: Device[], sites: Site[]) => {
  const d = devices.find((x) => x.id === c.deviceId);
  const s = d ? sites.find((x) => x.id === d.siteId) : undefined;
  return profileFlags(s?.videoProfile ?? 'P-SD').channels === 2 || c.kind === 'general';
};
