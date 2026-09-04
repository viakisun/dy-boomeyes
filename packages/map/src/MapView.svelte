<script lang="ts">
  // 지도 — 장비 마커(상태 5종 = domain.equipment 토큰) · 선택 시 onselect. 타일은 PUBLIC_TILE_STYLE_URL(기본 CARTO Positron) — 캡처는 타일 로드 대기.
  import maplibregl, { type Map as MLMap, type Marker } from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { onMount } from 'svelte';
  import type { MapViewProps } from './types';
  import { fanOffsets } from './fan';
  let {
    markers,
    center = [127.5, 36.3],
    zoom = 6.5,
    styleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    interactive = true,
    onselect,
    class: cls = '',
  }: MapViewProps = $props();
  let el = $state<HTMLDivElement>();
  let map: MLMap | undefined;
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- 비반응 핸들 캐시(DOM 마커 객체)
  const handles = new Map<string, Marker>();
  let ready = $state(false);
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
    const off = fanOffsets(markers.map((m) => ({ id: m.id, ...map!.project([m.lng, m.lat]) })));
    for (const [id, h] of handles) h.setOffset([off.get(id) ?? 0, 0]);
  }
  function pin(m: MapViewProps['markers'][number]) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'be-marker';
    d.setAttribute('aria-label', `${m.label} — ${m.state}`);
    d.dataset.state = m.state;
    d.style.cssText = `--pin:${COLOR[m.state] ?? COLOR.offline}`;
    d.innerHTML = `<span class="be-marker__dot">${GLYPH[m.state] ?? ''}</span><span class="be-marker__label">${m.label}</span>`;
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
    map.once('idle', () => el?.setAttribute('data-map-ready', ''));
    map.on('zoomend', relayout);
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
        const e = h.getElement();
        e.dataset.state = m.state;
        e.style.cssText = `--pin:${COLOR[m.state]}`;
      }
      h.getElement().classList.toggle('is-selected', !!m.selected);
    }
    for (const [id, h] of handles)
      if (!seen.has(id)) {
        h.remove();
        handles.delete(id);
      }
    relayout();
  });
</script>

<div bind:this={el} class="be-map {cls}" data-ready={ready || undefined}></div>

<style>
  .be-map {
    width: 100%;
    height: 100%;
    min-height: 240px;
    border-radius: var(--sys-radius-card);
    overflow: hidden;
    background: var(--sys-color-bg-surface-sunken);
  }
  :global(.be-marker) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
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
    width: 22px;
    height: 22px;
    border-radius: 9999px;
    background: var(--pin);
    color: var(--sys-color-fg-on-accent);
    border: 2px solid var(--sys-color-bg-surface);
    box-shadow: var(--sys-shadow-raised);
    font-weight: 700;
    font-size: 12px;
  }
  :global(.be-marker__label) {
    padding: 0 4px;
    border-radius: 4px;
    background: var(--sys-color-bg-surface);
    box-shadow: var(--sys-shadow-raised);
    white-space: nowrap;
  }
  :global(.be-marker.is-selected .be-marker__dot) {
    outline: 3px solid var(--sys-color-focus-ring);
    outline-offset: 1px;
  }
  :global(.be-marker:focus-visible) {
    outline: 2px solid var(--sys-color-focus-ring);
    outline-offset: 2px;
    border-radius: 4px;
  }
</style>
