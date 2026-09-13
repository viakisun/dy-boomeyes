<script lang="ts">
  // 지도 — 장비 마커(상태 5종 = domain.equipment 토큰) · 선택 시 onselect. 타일은 styleUrl prop(기본 CARTO Positron · 환경변수 배선은 W3, ADR-003) — 캡처는 타일 로드 대기.
  import maplibregl, { type Map as MLMap, type Marker } from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { onMount } from 'svelte';
  import { Button } from '@boomeyes/ui';
  import type { MapViewProps } from './types';
  import { fanOffsets, spreadCircles, FAN_PX } from './fan';
  import { outlineStyle } from './outline';
  let {
    markers,
    center = [127.5, 36.3],
    zoom = 6.5,
    styleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    basemap = 'tiles',
    muted = false,
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
  // 타일 베이스맵은 URL, 경계선 베이스맵은 그 자리에서 만든 스타일 객체(토큰 계산값을 읽는다).
  // 경계선 스타일은 styleUrl을 쓰지 않지만 테마 신호로 삼는다 — 앱이 테마마다 다른 URL을 넘기므로
  // (OwnerPage의 STYLE.light/dark) 그 변화가 아래 $effect를 깨워 토큰 값을 다시 읽게 한다.
  // styleUrl을 테마와 분리하게 되면 이 교체도 함께 끊긴다.
  const styleSpec = () => (basemap === 'outline' && el ? outlineStyle(el) : styleUrl);
  const EASE_MS = 700;
  const COLOR: Record<string, string> = {
    normal: 'var(--sys-color-domain-equipment-normal-solid)',
    caution: 'var(--sys-color-domain-equipment-caution-solid)',
    fault: 'var(--sys-color-domain-equipment-fault-solid)',
    offline: 'var(--sys-color-domain-equipment-offline-solid)',
    maintenance: 'var(--sys-color-domain-equipment-maintenance-solid)',
  };
  const GLYPH: Record<string, string> = { normal: '', caution: '!', fault: '✕', offline: '', maintenance: '⚙' };
  // 수신 없음은 글자 대신 wifi-off 아이콘(lucide 경로) — '·'은 읽히지 않는다
  const OFFLINE_SVG =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h.01"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5.2-2.7"/><path d="M19 12.9a10 10 0 0 0-2-1.5"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6"/><path d="M22 8.8A15 15 0 0 0 10.7 5"/><path d="m2 2 20 20"/></svg>';
  // 이름표를 놓을 자리 — 원 아래가 기본이고, 막히면 우 · 좌 · 위 · 우하 · 좌하 순으로 물러난다(시안 «확정 2026-09-13»)
  const LABEL_SLOTS = ['below', 'right', 'left', 'above', 'below-right', 'below-left'] as const;
  const LABEL_GAP = 4;
  // 이만큼 밀린 마커만 원래 좌표에 점과 선을 남긴다 — 1~2px 보정까지 그리면 지도가 선으로 덮인다
  const LEADER_MIN = 6;
  // 이름표 배치 순서 = 읽혀야 하는 순서. 이상 › 정상 › 보관 — 자리가 모자라면 보관소 이름부터 사라진다
  const labelRank = (m: M) => (m.state !== 'normal' ? 0 : m.variant === 'depot' ? 2 : 1);
  type Box = { x: number; y: number; w: number; h: number };
  const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  /**
   * 현장 이름표 배치 — 원(과 이미 놓인 이름표)을 피하는 첫 자리에 놓고, 없으면 숨긴다.
   * `area`는 지도에서 실제로 보이는 부분이다 — 띠·패널·시트가 덮은 자리에 이름표를 놓으면
   * 화면에서 사라지고(가려짐) 캡처의 자식 도달 검사가 「마커가 겹친다」로 떨어진다.
   * 억지로 끼워 넣지 않는 이유: 이름표가 다른 원을 덮으면 그 원을 누를 수 없고(캡처의 도달 검사)
   * 지도가 글자로 덮인다. 원 자체는 늘 남으므로 누를 것이 사라지지는 않는다.
   */
  function placeLabels(centers: Map<string, { x: number; y: number }>, size: { hit: number; dot: number }, area: Box) {
    const pad = size.dot / 2 + LABEL_GAP;
    const circles = [...centers].map(([, c]) => ({
      x: c.x - pad,
      y: c.y - pad,
      w: pad * 2,
      h: pad * 2,
    }));
    const boxes: Box[] = [...circles];
    const ordered = [...markers].sort((a, b) => labelRank(a) - labelRank(b) || (a.id < b.id ? -1 : 1));
    for (const m of ordered) {
      const el = handles.get(m.id)?.getElement();
      const label = el?.querySelector<HTMLElement>('.be-marker__label');
      const c = centers.get(m.id);
      if (!el || !label || !c) continue;
      label.classList.remove('is-hidden');
      const w = label.offsetWidth;
      const h = label.offsetHeight;
      const slot = LABEL_SLOTS.map((name) => {
        const r = { x: 0, y: 0, w, h };
        if (name === 'below') Object.assign(r, { x: c.x - w / 2, y: c.y + pad });
        else if (name === 'above') Object.assign(r, { x: c.x - w / 2, y: c.y - pad - h });
        else if (name === 'right') Object.assign(r, { x: c.x + pad, y: c.y - h / 2 });
        else if (name === 'left') Object.assign(r, { x: c.x - pad - w, y: c.y - h / 2 });
        // 우하·좌하는 「아래」를 좌우로 밀어 둔 자리다 — 대각으로 붙이면 제 원을 덮는다
        else if (name === 'below-right') Object.assign(r, { x: c.x + pad * 0.7, y: c.y + pad });
        else Object.assign(r, { x: c.x - pad * 0.7 - w, y: c.y + pad });
        return r;
      }).find(
        (r) =>
          r.x >= area.x &&
          r.y >= area.y &&
          r.x + r.w <= area.x + area.w &&
          r.y + r.h <= area.y + area.h &&
          !boxes.some((b) => overlaps(r, b)),
      );
      if (!slot) {
        label.classList.add('is-hidden');
        continue;
      }
      boxes.push(slot);
      // 마커 상자(hit)의 왼쪽 위를 원점으로 하는 좌표 — 마커는 원 중심에 붙어 있다
      label.style.left = `${Math.round(slot.x - (c.x - size.hit / 2))}px`;
      label.style.top = `${Math.round(slot.y - (c.y - size.hit / 2))}px`;
    }
  }
  // 겹치는 마커 펼침 — 마커 변경·줌 종료마다 화면 좌표로 다시 계산.
  function relayout() {
    if (!map || !el) return;
    const site = markers.some((m) => m.kind === 'site');
    const points = markers.map((m) => ({ id: m.id, ...map!.project([m.lng, m.lat]) }));
    // 현장 원은 중심 거리로 밀어 풀고(히트 영역이 겹치면 도달 검사가 깨진다), 호기 핀은 묶음 가로 펼침
    const first = handles.get(markers[0]?.id ?? '')?.getElement();
    const hit = first?.offsetWidth || FAN_PX;
    const dot = first?.querySelector<HTMLElement>('.be-marker__dot')?.offsetWidth || hit;
    const off = site
      ? spreadCircles(points, hit)
      : fanOffsets(
          points,
          pill ? (compact ? FAN_PX : FAN_PX * 1.75) : FAN_PX, // 알약 가로(≈ 98px) · 원형 핀(48px)
          pill ? (compact ? FAN_PX : FAN_PX * 1.5) : 24, // 묶음 거리 ≥ 핀 폭(48) — 겹치는 핀이 반드시 펼쳐진다
        );
    for (const [id, h] of handles) {
      const o = off.get(id) ?? { x: 0, y: 0 };
      h.setOffset([o.x, o.y]);
    }
    if (site) {
      // 카메라 여백 = 띠·패널·시트가 덮은 픽셀(장면이 계산해 넘긴다) — 그 안쪽이 이름표를 놓을 자리다
      const edge = camera?.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
      placeLabels(
        new Map(points.map((p) => [p.id, { x: p.x + (off.get(p.id)?.x ?? 0), y: p.y + (off.get(p.id)?.y ?? 0) }])),
        { hit, dot },
        {
          x: edge.left,
          y: edge.top,
          w: Math.max(0, el.clientWidth - edge.left - edge.right),
          h: Math.max(0, el.clientHeight - edge.top - edge.bottom),
        },
      );
    }
    // 밀린 마커는 원래 좌표에 점과 선을 남긴다 — 원이 실제 위치를 떠난 만큼만
    if (pill)
      leaders = markers.flatMap((marker) => {
        const point = map!.project([marker.lng, marker.lat]);
        const o = off.get(marker.id) ?? { x: 0, y: 0 };
        if (site && Math.hypot(o.x, o.y) < LEADER_MIN) return [];
        return [{ id: marker.id, x: point.x, y: point.y, endX: point.x + o.x, endY: point.y + o.y }];
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
  let cameraJson = '';
  // rearm = 단계가 바뀌는 이동만 준비 표식을 내렸다 올린다(여백 보정에는 유지 — 도구가 기다리는 표식이 깜빡이지 않게)
  function moveCamera(duration: number, rearm = true) {
    if (!map || !camera) return;
    const padding = camera.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const target =
      'bounds' in camera
        ? (map.cameraForBounds(camera.bounds, { padding, maxZoom: camera.maxZoom }) ??
          map.cameraForBounds(camera.bounds, {
            padding: Object.fromEntries(Object.entries(padding).map(([k, v]) => [k, v / 2])) as typeof padding,
            maxZoom: camera.maxZoom,
          }) ??
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
    if (m.variant) d.dataset.variant = m.variant;
    else delete d.dataset.variant;
    d.title = m.description ?? m.label;
    d.style.cssText = `--pin:${kind === 'unit' && pill && m.state === 'normal' ? 'var(--sys-color-fg-muted)' : (COLOR[m.state] ?? COLOR.offline)}`;
    const dot = d.querySelector('.be-marker__dot') as HTMLElement;
    const label = d.querySelector('.be-marker__label') as HTMLElement;
    if (kind === 'site') {
      // 현장 = 대수를 품은 원 하나(시안 «확정 2026-09-13») — 상태는 원의 색, 대수는 원 안의 수.
      // 이름표는 원 밖에 떠 있고 자리가 없으면 숨는다(placeLabels).
      dot.textContent = String(m.count ?? 0);
      label.replaceChildren(
        Object.assign(document.createElement('span'), { className: 'be-marker__name', textContent: m.label }),
      );
      if (m.sub)
        label.append(
          Object.assign(document.createElement('span'), { className: 'be-marker__state', textContent: m.sub }),
        );
      return;
    }
    // 호기 문법: 정상은 ✓ · 이상은 상태색 원 + 글리프 3종(✕ · ! · 수신 없음 아이콘)
    if (m.state === 'offline' && !compact) dot.innerHTML = OFFLINE_SVG;
    else
      dot.textContent = compact
        ? m.label.replace(/호기$/, '')
        : pill && m.state === 'normal'
          ? '✓'
          : (GLYPH[m.state] ?? '');
    label.textContent = m.label;
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
      style: styleSpec(),
      center,
      zoom,
      interactive,
      attributionControl: { compact: true },
    });
    // 지명 라벨 언어 — 스타일의 symbol 레이어 text-field를 name:<locale> 우선으로 바꾼다(타일에 없으면 name)
    const localize = () => {
      if (!map) return;
      for (const layer of map.getStyle()?.layers ?? []) {
        if (layer.type !== 'symbol' || !layer.layout || !('text-field' in layer.layout)) continue;
        if (labelLocale)
          map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', `name:${labelLocale}`], ['get', 'name']]);
        // 알약 지도에서는 베이스맵 지명(place_*)을 물러나게 — 마커 라벨과 부딪히지 않게
        if (pill && /place/.test(layer.id)) map.setPaintProperty(layer.id, 'text-opacity', 0.55);
      }
    };
    map.on('load', () => {
      localize();
      ready = true;
    });
    map.on('style.load', localize);
    // 스타일·소스 로드 실패만 오버레이 — 개별 타일 오류(e.tile)는 깊은 줌에서 흔하고 지도는 계속 쓸 수 있다.
    // 국경 지도(outline)는 저장소 안 자료로 그리므로 네트워크 오류가 이 지도의 실패가 아니다 —
    // 앞 단계의 타일 장애가 늦게 도착해 멀쩡한 전국 지도에 오류를 씌우지 않게 한다.
    map.on('error', (e) => {
      if (pill && basemap === 'tiles' && !(e as { tile?: unknown }).tile) failed = true;
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
        // 현장 원은 좌표 위에 앉고(anchor center), 호기 핀은 좌표를 아래 끝으로 가리킨다
        h = new maplibregl.Marker({ element: pin(m), anchor: m.kind === 'site' ? 'center' : 'bottom' })
          .setLngLat([m.lng, m.lat])
          .addTo(map);
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
    const json = JSON.stringify(camera);
    if (!changed && json === cameraJson) return; // 같은 장면의 재렌더(시뮬레이터 틱)는 카메라를 건드리지 않는다
    cameraKey = camera.key;
    cameraJson = json;
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    moveCamera(!animate || reduced ? 0 : changed ? EASE_MS : EASE_MS / 2, changed);
  });
  // 스타일(라이트/다크 베이스맵 · 타일↔경계선) 교체 — 마커는 DOM이라 남고, style.load에서 지명 처리가 다시 돈다
  let styleLoaded: string | undefined;
  $effect(() => {
    const next = `${basemap}|${styleUrl}`;
    // ready를 기다리지 않는다 — 첫 스타일이 실패하면 load가 늦어 교체 자체가 막혔다
    if (!map) return;
    if (styleLoaded === undefined) {
      styleLoaded = next;
      return;
    }
    if (next === styleLoaded) return;
    styleLoaded = next;
    // 앞 스타일의 실패를 새 스타일까지 끌고 가지 않는다 — 타일 장애 뒤 전국(국경 지도)으로
    // 올라가면 지도는 그려지는데 오류 안내만 남아 있었다
    failed = false;
    map.setStyle(styleSpec());
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
      class="be-map fit-markers {compact ? 'pins-compact' : ''} {muted ? 'muted' : ''} {cls}"
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
        class="bg-surface p-inset-lg gap-stack-sm absolute inset-0 flex flex-col items-start justify-start"
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
            map?.setStyle(styleSpec());
          }}>지도 다시 불러오기</Button
        >
      </div>
    {/if}
  </div>
{:else}
  <div bind:this={el} class="be-map {muted ? 'muted' : ''} {cls}" data-ready={ready || undefined}></div>
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
  /* 현장 단계의 회색조 타일(시안 «확정 2026-09-12») — 캔버스에만 걸린다.
     마커는 DOM이라 상태 색이 그대로 살아 있고, 도로·공원 색만 물러난다. */
  .be-map.muted :global(.maplibregl-canvas) {
    filter: grayscale(0.7) saturate(0.7);
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
  /* 현장 마커(시안 «확정 2026-09-13») — 대수를 품은 원 하나 + 그 옆에 뜨는 이름표.
     마커 상자는 터치 최소치(웹 44 · PWA 48)이고 원은 그보다 작다 — 밀어내기는 상자 크기로 한다. */
  .fit-markers :global(.be-marker[data-kind='site']) {
    /* position은 건드리지 않는다 — MapLibre가 absolute로 배치한다(덮어쓰면 마커가 좌표를 떠난다).
       그 absolute가 곧 이름표의 기준 상자이기도 하다. */
    display: block;
    width: max(var(--sys-size-touch-min), var(--sys-size-control-md));
    height: max(var(--sys-size-touch-min), var(--sys-size-control-md));
    min-height: 0;
    padding: 0;
    border: 0;
    background: none;
    box-shadow: none;
  }
  .fit-markers :global(.be-marker[data-kind='site'] .be-marker__dot) {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: var(--sys-size-control-sm);
    height: var(--sys-size-control-sm);
    border: var(--sys-border-width-strong) solid var(--pin);
    background: var(--pin);
    color: var(--sys-color-fg-on-accent);
    box-shadow: var(--sys-shadow-overlay);
    font: var(--sys-type-label-md);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  /* 정상 현장은 채우지 않는다 — 색은 확인이 필요한 곳의 것이다(원칙 4) */
  .fit-markers :global(.be-marker[data-kind='site'][data-state='normal'] .be-marker__dot) {
    background: var(--sys-color-bg-surface);
    border-color: var(--sys-color-border-strong);
    color: var(--sys-color-fg-default);
  }
  /* 보관소: 한 단계 더 물러난 회색 원 */
  .fit-markers :global(.be-marker[data-kind='site'][data-variant='depot'][data-state='normal'] .be-marker__dot) {
    background: var(--sys-color-bg-surface-sunken);
    border-color: var(--sys-color-border-default);
    color: var(--sys-color-fg-muted);
  }
  .fit-markers :global(.be-marker[data-kind='site'] .be-marker__label) {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0 var(--sys-space-inline-xs);
    border-radius: var(--sys-radius-control);
    background: var(--sys-color-bg-surface);
    box-shadow: var(--sys-shadow-raised);
    white-space: nowrap;
    text-align: left;
  }
  .fit-markers :global(.be-marker__name) {
    font: var(--sys-type-label-md);
    font-weight: 600;
  }
  .fit-markers :global(.be-marker__state) {
    font: var(--sys-type-label-sm);
    color: var(--sys-color-fg-muted);
  }
  .fit-markers :global(.be-marker[data-state='fault'] .be-marker__state),
  .fit-markers :global(.be-marker[data-state='caution'] .be-marker__state),
  .fit-markers :global(.be-marker[data-state='offline'] .be-marker__state) {
    color: var(--pin);
    font-weight: 600;
  }
  /* 자리가 없는 이름표는 숨긴다 — 원은 남으므로 누를 것이 사라지지 않는다.
     선택자는 위의 이름표 규칙(display:flex)보다 구체적이어야 한다 — 덜 구체적이면 조용히 진다. */
  .fit-markers :global(.be-marker[data-kind='site'] .be-marker__label.is-hidden) {
    display: none;
  }
  .fit-markers :global(.be-marker[data-kind='site'].is-selected .be-marker__dot) {
    border-color: var(--sys-color-accent-border-strong);
    outline: var(--sys-border-width-focus) solid var(--sys-color-focus-ring);
    outline-offset: 1px;
  }
  /* 좁은 지도: 호기 번호만 담은 원형 핀(상태는 색 + aria-label) */
  .pins-compact :global(.be-marker[data-kind='unit']) {
    min-width: max(var(--sys-size-touch-min), var(--sys-size-control-md));
    padding: 0;
    justify-content: center;
    border-radius: var(--sys-radius-pill);
  }
  .pins-compact :global(.be-marker[data-kind='unit'] .be-marker__dot) {
    width: var(--sys-size-icon-xl);
    height: var(--sys-size-icon-xl);
    font: var(--sys-type-label-md);
    font-weight: 700;
  }
  /* 라벨은 화면에서만 숨긴다(접근성 이름·도구의 자식 중심점 검사 유지) — 마커 중앙 1px 클립.
     현장 이름표는 좁은 지도에서도 그대로 둔다 — 자리가 없으면 placeLabels가 알아서 숨긴다. */
  /* 마커 자체는 MapLibre가 absolute로 배치한다 — position을 덮어쓰지 않는다(덮어쓰면 핀이 어긋난다) */
  .pins-compact :global(.be-marker[data-kind='unit'] .be-marker__label) {
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
  .fit-markers :global(.be-marker[data-kind='unit'].is-selected) {
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
