<script lang="ts">
  // 지도 — 장비 마커(상태 5종 = domain.equipment 토큰) · 선택 시 onselect. 타일은 styleUrl prop(기본 CARTO Positron · 환경변수 배선은 W3, ADR-003) — 캡처는 타일 로드 대기.
  import maplibregl, { type Map as MLMap, type Marker } from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { onMount } from 'svelte';
  import { Button } from '@boomeyes/ui';
  import type { MapViewProps } from './types';
  import { fanOffsets, FAN_PX } from './fan';
  let {
    markers,
    center = [127.5, 36.3],
    zoom = 6.5,
    styleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    interactive = true,
    fitMarkers = false,
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
  let leaders = $state<{ id: string; x: number; y: number; endX: number }[]>([]);
  // 좁은 지도(< 480px)에서는 호기 번호만 담은 원형 핀 — 알약이 펼쳐져 화면 밖으로 나가지 않게
  let compact = $state(false);
  const COMPACT_BELOW = 480;
  const COLOR: Record<string, string> = {
    normal: 'var(--sys-color-domain-equipment-normal-solid)',
    caution: 'var(--sys-color-domain-equipment-caution-solid)',
    fault: 'var(--sys-color-domain-equipment-fault-solid)',
    offline: 'var(--sys-color-domain-equipment-offline-solid)',
    maintenance: 'var(--sys-color-domain-equipment-maintenance-solid)',
  };
  const GLYPH: Record<string, string> = { normal: '', caution: '!', fault: '✕', offline: '·', maintenance: '⚙' };
  // 겹치는 마커 펼침 — 마커 변경·줌 종료마다 화면 좌표로 다시 계산
  function relayout() {
    if (!map) return;
    const off = fanOffsets(
      markers.map((m) => ({ id: m.id, ...map!.project([m.lng, m.lat]) })),
      fitMarkers ? (compact ? FAN_PX : FAN_PX * 1.75) : FAN_PX, // fit-markers 알약(≈ 80px) · 좁은 지도 원형 핀(48px)
      fitMarkers ? (compact ? FAN_PX : FAN_PX * 1.5) : 24, // 묶음 거리 ≥ 핀 폭(48) — 겹치는 핀이 반드시 펼쳐진다
    );
    for (const [id, h] of handles) h.setOffset([off.get(id) ?? 0, 0]);
    if (fitMarkers)
      leaders = markers.map((marker) => {
        const point = map!.project([marker.lng, marker.lat]);
        return { id: marker.id, x: point.x, y: point.y, endX: point.x + (off.get(marker.id) ?? 0) };
      });
  }
  type M = MapViewProps['markers'][number];
  // 생성·갱신 공용 — 색·글리프·라벨·aria-label을 한 번에 (상태 변경 시 글리프가 남는 사고 방지)
  function paint(d: HTMLElement, m: M) {
    d.setAttribute('aria-label', `${m.description ?? m.label} — ${m.state}`);
    d.dataset.state = m.state;
    d.title = m.description ?? m.label;
    d.style.cssText = `--pin:${fitMarkers && m.state === 'normal' ? 'var(--sys-color-fg-muted)' : (COLOR[m.state] ?? COLOR.offline)}`;
    (d.querySelector('.be-marker__dot') as HTMLElement).textContent = compact
      ? m.label.replace(/호기$/, '')
      : fitMarkers && m.state === 'normal'
        ? '✓'
        : (GLYPH[m.state] ?? '');
    (d.querySelector('.be-marker__label') as HTMLElement).textContent = m.label;
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
    d.addEventListener('click', () => onselect?.(m.id));
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
    map.on('error', () => {
      if (fitMarkers) failed = true;
    });
    map.once('idle', () => el?.setAttribute('data-map-ready', ''));
    const ro =
      fitMarkers && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            compact = (el?.clientWidth ?? 0) < COMPACT_BELOW;
          })
        : undefined;
    ro?.observe(el);
    compact = fitMarkers && el.clientWidth < COMPACT_BELOW;
    map.on('zoomend', relayout);
    if (fitMarkers) {
      map.on('move', relayout);
      map.on('resize', relayout);
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
</script>

{#if fitMarkers}
  <div class="relative h-full w-full">
    <div
      bind:this={el}
      class="be-map fit-markers {compact ? 'pins-compact' : ''} {cls}"
      data-ready={ready || undefined}
    ></div>
    <svg class="map-leaders pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {#each leaders as point (point.id)}
        <line x1={point.x} y1={point.y} x2={point.endX} y2={point.y} />
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
