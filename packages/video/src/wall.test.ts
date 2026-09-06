// [A1-04] 현장 프로파일 AX-1 — 1채널(P-LITE) 현장의 AI 채널은 월·모달에서 숨긴다 (video-basics design)
import { describe, expect, it } from 'vitest';
import type { Camera, Device, Site } from '@boomeyes/domain';
import { visibleIn } from './wall';

const site = (id: string, videoProfile: Site['videoProfile']) => ({ id, videoProfile }) as Site;
const device = (id: string, siteId: string) => ({ id, siteId }) as Device;
const camera = (id: string, deviceId: string, kind: Camera['kind']) => ({ id, deviceId, kind }) as Camera;
const sites = [site('SITE-1', 'P-LITE'), site('SITE-2', 'P-SD')];
const devices = [device('CPB-1', 'SITE-1'), device('CPB-2', 'SITE-2')];

describe('[A1-04] visibleIn', () => {
  it('P-LITE(1채널) 현장은 AI 채널을 숨기고 전방 채널만 보인다', () => {
    expect(visibleIn(camera('CAM-1-1', 'CPB-1', 'general'), devices, sites)).toBe(true);
    expect(visibleIn(camera('CAM-1-2', 'CPB-1', 'ai'), devices, sites)).toBe(false);
  });
  it('P-SD(2채널) 현장은 두 채널 모두 보인다', () => {
    expect(visibleIn(camera('CAM-2-1', 'CPB-2', 'general'), devices, sites)).toBe(true);
    expect(visibleIn(camera('CAM-2-2', 'CPB-2', 'ai'), devices, sites)).toBe(true);
  });
  it('호기·현장을 못 찾으면 기본 프로파일(P-SD)로 본다', () => {
    expect(visibleIn(camera('CAM-9-2', 'CPB-9', 'ai'), devices, sites)).toBe(true);
  });
});
