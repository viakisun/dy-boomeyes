<script lang="ts">
  // 지도 — 장비 마커(상태 5종 = domain.equipment 토큰) · 선택 시 onselect. 타일은 styleUrl prop(기본 CARTO Positron · 환경변수 배선은 W3, ADR-003) — 캡처는 타일 로드 대기.
  import maplibregl, { type Map as MLMap, type Marker } from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { onMount } from 'svelte';
  import { Button } from '@boomeyes/ui';
  import type { MapViewProps } from './types';
  import { fanOffsets, resolveOverlaps, FAN_PX } from './fan';
  let {
    markers,
    center = [127.5, 36.3],
    zoom = 6.5,
    styleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    interactive = true,
    fitMarkers = false,
    camera,
    animate = false,
    pins = 'auto',
    level,
    onselect,
    labelLocale,
    class: cls = '',
  }: MapViewProps = $props();
  let el = $state<HTMLDivElement>();
  let map: MLMap | undefined;
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- 비반응 핸들 캐시(DOM 마커 객체)
  const handles = new Map<string, Marker>();
  let ready = $state(false);
  let failed = $state(false);
  let leaders = $state<{ id: string; x: number; y: number; endX: number; endY: number }[]>([]);
  // 좁은 지도(< 480px)에서는 호기 번호만 담은 원형 핀 — 알약이 펼쳐져 화면 밖으로 나가지 않게
  let narrow = $state(false);
  const compact = $derived(pins === 'compact' || (pins === 'auto' && narrow));
  // 알약 지도 = fitMarkers(자동 맞춤) 또는 camera(장면 카메라)
  const pill = $derived(fitMarkers || !!camera);
  const COMPACT_BELOW = 480;
  const EASE_MS = 700;
  const COLOR: Record<string, string> = {
    normal: 'var(--sys-color-domain-equipment-normal-solid)',
    caution: 'var(--sys-color-domain-equipment-caution-solid)',
    fault: 'var(--sys-color-domain-equipment-fault-solid)',
    offline: 'var(--sys-color-domain-equipment-offline-solid)',
    maintenance: 'var(--sys-color-domain-equipment-maintenance-solid)',
  };
  const GLYPH: Record<string, string> = { normal: '', caution: '!', fault: '✕', offline: '·', maintenance: '⚙' };
  // 겹치는 마커 펼침 — 마커 변경·줌 종료마다 화면 좌표로 다시 계산. 현장·지역 알약은 세로로 펼쳐 옆 패널에 가려지지 않게 한다.
  function relayout() {
    if (!map) return;
    const vertical = markers.some((m) => m.kind === 'site' || m.kind === 'region');
    const points = markers.map((m) => ({ id: m.id, ...map!.project([m.lng, m.lat]) }));
    // 현장·지역 알약(폭 ≈ 110px)은 상자 겹침을 세로로 밀어 풀고, 호기 핀은 묶음 가로 펼침
    const off = vertical
      ? resolveOverlaps(points, { w: FAN_PX * 2, h: FAN_PX })
      : fanOffsets(
          points,
          pill ? (compact ? FAN_PX : FAN_PX * 1.75) : FAN_PX, // 알약 가로(≈ 98px) · 원형 핀(48px)
          pill ? (compact ? FAN_PX : FAN_PX * 1.5) : 24, // 묶음 거리 ≥ 핀 폭(48) — 겹치는 핀이 반드시 펼쳐진다
        );
    for (const [id, h] of handles) {
      const o = off.get(id) ?? { x: 0, y: 0 };
      h.setOffset([o.x, o.y]);
    }
    if (pill)
      leaders = markers.map((marker) => {
        const point = map!.project([marker.lng, marker.lat]);
        const o = off.get(marker.id) ?? { x: 0, y: 0 };
        return { id: marker.id, x: point.x, y: point.y, endX: point.x + o.x, endY: point.y + o.y };
      });
  }
  // 준비 표식 — 카메라 이동마다 내렸다가 다음 idle에 다시 세운다(캡처·e2e는 단계 속성까지 기다린다)
  function arm() {
    if (!map || !el) return;
    el.removeAttribute('data-map-ready');
    map.once('idle', () => {
      if (!el) return;
      el.setAttribute('data-map-ready', '');
      if (level) el.dataset.mapLevel = level;
      el.dataset.mapMarkers = String(markers.length);
    });
  }
  let cameraKey: string | undefined;
  // rearm = 단계가 바뀌는 이동만 준비 표식을 내렸다 올린다(여백 보정에는 유지 — 도구가 기다리는 표식이 깜빡이지 않게)
  function moveCamera(duration: number, rearm = true) {
    if (!map || !camera) return;
    const padding = camera.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const target =
      'bounds' in camera
        ? (map.cameraForBounds(camera.bounds, { padding, maxZoom: camera.maxZoom }) ??
          map.cameraForBounds(camera.bounds, { maxZoom: camera.maxZoom }))
        : { center: camera.center, zoom: camera.zoom, padding };
    if (!target) return;
    if (rearm) arm();
    // padding은 카메라 계산에만 쓰고 지도 상태(getPadding)에 남기지 않는다 — 다음 이동에 누적되지 않게
    map.easeTo({
      center: target.center,
      zoom: target.zoom,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      duration,
      essential: true,
    });
  }
  type M = MapViewProps['markers'][number];
  // 생성·갱신 공용 — 색·글리프·라벨·aria-label을 한 번에 (상태 변경 시 글리프가 남는 사고 방지)
  function paint(d: HTMLElement, m: M) {
    const kind = m.kind ?? 'unit';
    d.setAttribute('aria-label', `${m.description ?? m.label} — ${m.state}`);
    d.dataset.state = m.state;
    d.dataset.kind = kind;
    d.title = m.description ?? m.label;
    d.style.cssText = `--pin:${pill && m.state === 'normal' ? 'var(--sys-color-fg-muted)' : (COLOR[m.state] ?? COLOR.offline)}`;
    (d.querySelector('.be-marker__dot') as HTMLElement).textContent =
      kind === 'region'
        ? String(m.count ?? '')
        : compact && kind === 'unit'
          ? m.label.replace(/호기$/, '')
          : pill && m.state === 'normal'
            ? kind === 'unit'
              ? '✓'
              : ''
            : (GLYPH[m.state] ?? '');
    (d.querySelector('.be-marker__label') as HTMLElement).textContent = m.label;
    // 대수 배지는 현장 알약에만 만든다(빈 자식을 남기지 않는다 — 캡처 도구의 자식 중심 도달 검사)
    let count = d.querySelector('.be-marker__count') as HTMLElement | null;
    if (kind === 'site' && m.count !== undefined) {
      if (!count)
        count = d.appendChild(Object.assign(document.createElement('span'), { className: 'be-marker__count' }));
      count.textContent = String(m.count);
    } else count?.remove();
  }
  function pin(m: M) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'be-marker';
    d.append(
      Object.assign(document.createElement('span'), { className: 'be-marker__dot' }),
      Object.assign(document.createElement('span'), { className: 'be-marker__label' }),
    );
    paint(d, m);
    d.addEventListener('click', () => onselect?.(m.id, m.kind ?? 'unit'));
    return d;
  }
  onMount(() => {
    if (!el) return;
    map = new maplibregl.Map({
      container: el,
      style: styleUrl,
      center,
      zoom,
      interactive,
      attributionControl: { compact: true },
    });
    // 지명 라벨 언어 — 스타일의 symbol 레이어 text-field를 name:<locale> 우선으로 바꾼다(타일에 없으면 name)
    const localize = () => {
      if (!map || !labelLocale) return;
      for (const layer of map.getStyle()?.layers ?? []) {
        if (layer.type !== 'symbol' || !layer.layout || !('text-field' in layer.layout)) continue;
        map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', `name:${labelLocale}`], ['get', 'name']]);
      }
    };
    map.on('load', () => {
      localize();
      ready = true;
    });
    map.on('style.load', localize);
    // 스타일·소스 로드 실패만 오버레이 — 개별 타일 오류(e.tile)는 깊은 줌에서 흔하고 지도는 계속 쓸 수 있다
    map.on('error', (e) => {
      if (pill && !(e as { tile?: unknown }).tile) failed = true;
    });
    if (!camera) map.once('idle', () => el?.setAttribute('data-map-ready', ''));
    const ro =
      pill && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            narrow = (el?.clientWidth ?? 0) < COMPACT_BELOW;
          })
        : undefined;
    ro?.observe(el);
    narrow = pill && el.clientWidth < COMPACT_BELOW;
    map.on('zoomend', relayout);
    if (pill) {
      map.on('move', relayout);
      map.on('resize', () => {
        relayout();
        if (camera) moveCamera(0, false);
      });
    }
    return () => {
      ro?.disconnect();
      map?.remove();
      map = undefined;
    };
  });
  $effect(() => {
    if (!map || !ready) return;
    void compact;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- 지역 집합
    const seen = new Set<string>();
    for (const m of markers) {
      seen.add(m.id);
      let h = handles.get(m.id);
      if (!h) {
        h = new maplibregl.Marker({ element: pin(m), anchor: 'bottom' }).setLngLat([m.lng, m.lat]).addTo(map);
        handles.set(m.id, h);
      } else {
        h.setLngLat([m.lng, m.lat]);
        paint(h.getElement(), m);
      }
      h.getElement().classList.toggle('is-selected', !!m.selected);
    }
    for (const [id, h] of handles)
      if (!seen.has(id)) {
        h.remove();
        handles.delete(id);
      }
    relayout();
    if (camera) return; // 장면 카메라는 아래 $effect가 맡는다
    if (fitMarkers && markers.length) {
      const bounds = new maplibregl.LngLatBounds();
      for (const marker of markers) bounds.extend([marker.lng, marker.lat]);
      const inset = el ? parseFloat(getComputedStyle(el).getPropertyValue('--sys-space-inset-xl')) : 0;
      // 아래쪽은 저작권 컨트롤 높이만큼 더 비운다(핀이 저작권 위에 놓이지 않게)
      map.fitBounds(bounds, {
        padding: { top: inset * 3, left: inset * 3, right: inset * 3, bottom: inset * 4 },
        maxZoom: 7,
        duration: 0,
      });
    }
  });
  // 장면 카메라 — key가 바뀌면 이동(애니메이션은 animate && motion 허용일 때만), 여백만 바뀌면 짧게 보정
  $effect(() => {
    if (!map || !ready || !camera) return;
    const changed = camera.key !== cameraKey;
    cameraKey = camera.key;
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    moveCamera(!animate || reduced ? 0 : changed ? EASE_MS : EASE_MS / 2, changed);
  });
  // 카메라는 그대로인데 단계만 바뀌는 경우(현장 → 호기) — 준비 표식은 유지하고 단계 속성만 갱신
  $effect(() => {
    if (level && el?.hasAttribute('data-map-ready')) el.dataset.mapLevel = level;
  });
</script>

{#if pill}
  <div class="relative h-full w-full">
    <div
      bind:this={el}
      class="be-map fit-markers {compact ? 'pins-compact' : ''} {cls}"
      data-ready={ready || undefined}
    ></div>
    <svg class="map-leaders pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {#each leaders as point (point.id)}
        <line x1={point.x} y1={point.y} x2={point.endX} y2={point.endY} />
        <circle cx={point.x} cy={point.y} />
      {/each}
    </svg>
    {#if failed}
      <div
        class="bg-surface p-inset-lg gap-stack-sm absolute inset-0 flex flex-col items-start justify-center"
        data-map-error
        role="status"
      >
        <p class="text-heading-sm">지도를 불러오지 못했습니다</p>
        <p class="text-body-md text-fg-muted">아래 장비 목록에서 현장과 위치 정보를 확인할 수 있습니다.</p>
        <Button
          variant="outline"
          tone="neutral"
          onclick={() => {
            failed = false;
            map?.setStyle(styleUrl);
          }}>지도 다시 불러오기</Button
        >
      </div>
    {/if}
  </div>
{:else}
  <div bind:this={el} class="be-map {cls}" data-ready={ready || undefined}></div>
{/if}

<style>
  .be-map {
    width: 100%;
    height: 100%;
    min-height: var(--sys-layout-map-min);
    border-radius: var(--sys-radius-card);
    overflow: hidden;
    background: var(--sys-color-bg-surface-sunken);
  }
  .map-leaders line {
    stroke: var(--sys-color-fg-muted);
    stroke-width: var(--sys-border-width-strong);
  }
  .map-leaders circle {
    r: var(--sys-space-stack-xs);
    fill: var(--sys-color-fg-default);
    stroke: var(--sys-color-bg-surface);
    stroke-width: var(--sys-border-width-strong);
  }
  .be-map.fit-markers {
    min-height: 0;
  }
  /* 소유주 지도(fit-markers): 상태 점 + 호기 라벨을 한 알약에 — 지명 라벨과 겹쳐도 읽힌다 */
  .fit-markers :global(.be-marker) {
    flex-direction: row;
    gap: var(--sys-space-inline-xs);
    min-height: max(var(--sys-size-touch-min), var(--sys-size-control-md));
    padding: var(--sys-space-inset-xs) var(--sys-space-inset-sm) var(--sys-space-inset-xs) var(--sys-space-inset-xs);
    border-radius: var(--sys-radius-pill);
    background: var(--sys-color-bg-surface);
    border: var(--sys-border-width-default) solid var(--sys-color-border-default);
    box-shadow: var(--sys-shadow-overlay);
    font: var(--sys-type-label-md);
    font-weight: 600;
  }
  .fit-markers :global(.be-marker__dot) {
    width: var(--sys-size-icon-md);
    height: var(--sys-size-icon-md);
    border-width: 0;
    box-shadow: none;
    font: var(--sys-type-label-sm);
    font-weight: 700;
  }
  .fit-markers :global(.be-marker__label) {
    padding: 0;
    background: none;
    box-shadow: none;
  }
  /* 현장 알약: 대수 배지(텍스트 색만 — 색 예산은 상태 점이 쓴다) */
  .fit-markers :global(.be-marker__count) {
    min-width: var(--sys-size-icon-md);
    padding: 0 var(--sys-space-inline-xs);
    border-radius: var(--sys-radius-pill);
    background: var(--sys-color-bg-surface-sunken);
    color: var(--sys-color-fg-muted);
    font: var(--sys-type-label-sm);
    font-weight: 700;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  /* 지역 집계: 대수를 담은 큰 원 + 지역명 */
  .fit-markers :global(.be-marker[data-kind='region'] .be-marker__dot) {
    width: var(--sys-size-control-lg);
    height: var(--sys-size-control-lg);
    font: var(--sys-type-label-md);
    font-weight: 700;
  }
  .fit-markers :global(.be-marker[data-kind='region']) {
    padding: var(--sys-space-inset-xs) var(--sys-space-inset-sm) var(--sys-space-inset-xs) var(--sys-space-inset-xs);
  }
  /* 좁은 지도: 호기 번호만 담은 원형 핀(상태는 색 + aria-label) */
  .pins-compact :global(.be-marker) {
    min-width: max(var(--sys-size-touch-min), var(--sys-size-control-md));
    padding: 0;
    justify-content: center;
    border-radius: var(--sys-radius-pill);
  }
  .pins-compact :global(.be-marker__dot) {
    width: var(--sys-size-icon-xl);
    height: var(--sys-size-icon-xl);
    font: var(--sys-type-label-md);
    font-weight: 700;
  }
  /* 좁은 지도에서 현장 알약은 그대로 둔다(이름이 곧 식별자) — 원형 축약은 호기 핀만 */
  .pins-compact :global(.be-marker[data-kind='site']),
  .pins-compact :global(.be-marker[data-kind='region']) {
    padding: var(--sys-space-inset-xs) var(--sys-space-inset-sm) var(--sys-space-inset-xs) var(--sys-space-inset-xs);
    justify-content: flex-start;
  }
  .pins-compact :global(.be-marker[data-kind='site'] .be-marker__dot),
  .pins-compact :global(.be-marker[data-kind='region'] .be-marker__dot) {
    width: var(--sys-size-icon-md);
    height: var(--sys-size-icon-md);
    font: var(--sys-type-label-sm);
  }
  .pins-compact :global(.be-marker[data-kind='region'] .be-marker__dot) {
    width: var(--sys-size-icon-xl);
    height: var(--sys-size-icon-xl);
    font: var(--sys-type-label-md);
  }
  .pins-compact :global(.be-marker[data-kind='site'] .be-marker__label),
  .pins-compact :global(.be-marker[data-kind='region'] .be-marker__label) {
    position: static;
    width: auto;
    height: auto;
    clip-path: none;
    overflow: visible;
  }
  /* 라벨은 화면에서만 숨긴다(접근성 이름·도구의 자식 중심점 검사 유지) — 마커 중앙 1px 클립 */
  /* 마커 자체는 MapLibre가 absolute로 배치한다 — position을 덮어쓰지 않는다(덮어쓰면 핀이 어긋난다) */
  .pins-compact :global(.be-marker__label) {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  /* 좁은 지도: 저작권은 아이콘만(펼친 문구가 핀을 덮지 않게) */
  .pins-compact :global(.maplibregl-ctrl-attrib.maplibregl-compact-show .maplibregl-ctrl-attrib-inner) {
    display: none;
  }
  .pins-compact :global(.maplibregl-ctrl-attrib.maplibregl-compact-show) {
    padding: 0;
    min-height: var(--sys-size-icon-lg);
    min-width: var(--sys-size-icon-lg);
  }
  .fit-markers :global(.be-marker.is-selected) {
    border-color: var(--sys-color-accent-border-strong);
    background: var(--sys-color-accent-bg);
  }
  :global(.be-marker) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sys-space-stack-xs);
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    font: var(--sys-type-label-sm);
    color: var(--sys-color-fg-default);
  }
  :global(.be-marker__dot) {
    display: grid;
    place-items: center;
    width: var(--sys-size-badge);
    height: var(--sys-size-badge);
    border-radius: var(--sys-radius-pill);
    background: var(--pin);
    color: var(--sys-color-fg-on-accent);
    border: var(--sys-border-width-strong) solid var(--sys-color-bg-surface);
    box-shadow: var(--sys-shadow-raised);
    font-weight: 700;
  }
  :global(.be-marker__label) {
    padding: 0 var(--sys-space-inline-xs);
    border-radius: var(--sys-radius-control);
    background: var(--sys-color-bg-surface);
    box-shadow: var(--sys-shadow-raised);
    white-space: nowrap;
  }
  :global(.be-marker.is-selected .be-marker__dot) {
    outline: var(--sys-border-width-focus) solid var(--sys-color-focus-ring);
    outline-offset: 1px;
  }
  :global(.be-marker:focus-visible) {
    outline: var(--sys-border-width-focus) solid var(--sys-color-focus-ring);
    outline-offset: var(--sys-border-width-focus);
    border-radius: var(--sys-radius-control);
  }
</style>
