// 전국 단계의 타일 없는 경계선 지도(시안 «운영 현황 목업» — «확정 2026-09-12»).
// 전국에서 필요한 것은 국경 하나와 현장 원이다. 도로·지명 타일은 그 배율에서 읽히지도 않으면서
// 마커와 색을 다툰다. 대한민국만 면으로 채우고 이웃 나라는 해안선만 그린다 — 면 색을 더 쓰면
// 두 테마 중 한쪽에서 바다·이웃·국토의 밝기 순서가 뒤집힌다.
import type { GeoJSONSourceSpecification, StyleSpecification } from 'maplibre-gl';
import region from './korea-region.json';

const KR = '410'; // ISO 3166-1 numeric — world-atlas의 country id(tools/map/outline.mjs)

/** 토큰 값은 CSS 변수로만 산다 — WebGL 페인트에 넣으려면 지도 요소에서 계산값을 읽는다(테마 교체 시 다시 읽는다). */
export function outlineStyle(el: HTMLElement): StyleSpecification {
  const css = getComputedStyle(el);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    version: 8,
    sources: {
      region: {
        type: 'geojson',
        data: region as GeoJSONSourceSpecification['data'],
        attribution: 'Natural Earth',
      },
    },
    layers: [
      // 바다는 sunken, 국토는 surface — 라이트에서 바다가 국토보다 어둡고 다크에서도 순서가 뒤집히지 않는다
      { id: 'ground', type: 'background', paint: { 'background-color': token('--sys-color-bg-surface-sunken') } },
      {
        id: 'neighbour-line',
        type: 'line',
        source: 'region',
        filter: ['!=', ['get', 'iso'], KR],
        paint: { 'line-color': token('--sys-color-border-subtle'), 'line-width': 1 },
      },
      {
        id: 'korea-fill',
        type: 'fill',
        source: 'region',
        filter: ['==', ['get', 'iso'], KR],
        paint: { 'fill-color': token('--sys-color-bg-surface') },
      },
      {
        id: 'korea-line',
        type: 'line',
        source: 'region',
        filter: ['==', ['get', 'iso'], KR],
        paint: { 'line-color': token('--sys-color-border-strong'), 'line-width': 1.5 },
      },
    ],
  };
}
