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
    class: cls = '',
  }: MapViewProps = $props();
  let el = $state<HTMLDivElement>();
  let map: MLMap | undefined;
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- 비반응 핸들 캐시(DOM 마커 객체)
  const handles = new Map<string, Marker>();
  let ready = $state(false);
  let failed = $state(false);
  let leaders = $state<{ id: string; x: number; y: number; endX: number }[]>([]);
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
      fitMarkers ? FAN_PX * 1.5 : FAN_PX,
      fitMarkers ? FAN_PX : 24,
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
    d.style.cssText = `--pin:${COLOR[m.state] ?? COLOR.offline}`;
    (d.querySelector('.be-marker__dot') as HTMLElement).textContent = GLYPH[m.state] ?? '';
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
    map.on('load', () => {
      ready = true;
    });
    map.on('error', () => {
      if (fitMarkers) failed = true;
    });
    map.once('idle', () => el?.setAttribute('data-map-ready', ''));
    map.on('zoomend', relayout);
    if (fitMarkers) {
      map.on('move', relayout);
      map.on('resize', relayout);
    }
    return () => {
      map?.remove();
      map = undefined;
    };
  });
  $effect(() => {
    if (!map || !ready) return;
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
      map.fitBounds(bounds, { padding: inset * 3, maxZoom: 7, duration: 0 });
    }
  });
</script>

{#if fitMarkers}
  <div class="relative h-full w-full">
    <div bind:this={el} class="be-map fit-markers {cls}" data-ready={ready || undefined}></div>
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
  .fit-markers :global(.be-marker) {
    min-width: max(var(--sys-size-touch-min), var(--sys-size-control-md));
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
