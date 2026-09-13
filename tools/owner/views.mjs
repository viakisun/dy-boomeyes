// 소유주 데모가 다루는 화면 목적 — 캡처·예외·증거 검사가 같은 한 곳에서 읽는다.
// 목적 수를 고정하지 않는다: ssot/meta.yaml owner_demo_wave 이하로 내려온 화면만 대상이고,
// 계약·운전자처럼 아직 만들지 않은 화면(웨이브 5)은 구현되면 웨이브가 내려와 저절로 편입된다.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/** owner_demo에서 web·pwa 양쪽 화면이 owner_demo_wave 이하인 목적만 (원천 순서 유지) */
export function ownerViews(root, screensSource) {
  const source = screensSource ?? parse(readFileSync(join(root, 'ssot/screens.yaml'), 'utf8'));
  const wave = parse(readFileSync(join(root, 'ssot/meta.yaml'), 'utf8')).owner_demo_wave;
  if (typeof wave !== 'number') throw new Error('ssot/meta.yaml: owner_demo_wave가 없다');
  const waveOf = (id) => source.screens.find((s) => s.id === id)?.wave;
  const views = (source.owner_demo ?? []).filter((v) =>
    ['web', 'pwa'].every((app) => typeof waveOf(v[app]) === 'number' && waveOf(v[app]) <= wave),
  );
  if (!views.length || new Set(views.map((v) => v.view)).size !== views.length)
    throw new Error('owner_demo: 구현된 화면 목적이 없거나 중복이다');
  for (const v of views)
    for (const app of ['web', 'pwa'])
      if (waveOf(v[app]) === undefined) throw new Error(`owner_demo: ${v.view}/${app} 화면(${v[app]})이 없다`);
  return views;
}

/**
 * 한 화면 목적이 주소로 갖는 단계 — 원천은 `ssot/meta.yaml`의 `owner_demo_levels`다.
 * 캡처·증거 검사·검토안이 같은 곳을 읽는다(도구마다 적어 두면 한쪽만 늘어 증거가 갈라진다).
 * 첫 값은 기본 화면이다(키에 접미사가 붙지 않는다). 적히지 않은 목적은 단계가 없다.
 */
export function ownerLevels(root, view) {
  const meta = parse(readFileSync(join(root, 'ssot/meta.yaml'), 'utf8'));
  return (meta.owner_demo_levels ?? {})[view] ?? [null];
}

/** 캡처 키의 단계 접미사 — 기본 화면은 빈 문자열 */
export const levelSuffix = (level) => (level && level !== 'nation' ? `-${level}` : '');
