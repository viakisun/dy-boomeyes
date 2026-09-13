<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { OwnerApi, OwnerView } from '@boomeyes/domain';
  import { OwnerWorkspace, theme } from '@boomeyes/ui';
  import { AiEventShot, OwnerVideo, OwnerLiveTile } from '@boomeyes/video';
  import { MapView, ownerBasemap, ownerCamera, ownerMarkers } from '@boomeyes/map';
  let {
    api,
    view,
    capture = false,
    sim = false,
  }: { api: OwnerApi; view: OwnerView; capture?: boolean; sim?: boolean } = $props();
  const APP = 'web';
  // 베이스맵은 테마를 따른다(CARTO Positron / Dark Matter — ADR-003) — 다크에서 밝은 지도 위에 검은 알약이 뜨지 않게
  const dark = $derived(theme.value ? theme.value === 'dark' : theme.system);
  const STYLE = {
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  } as const;
  // 같은 경로의 쿼리 교체는 replace(필터·선택), 드릴다운은 push(뒤로가기로 한 단계 위로)
  const navigate = (href: string, opts: { history?: 'push' | 'replace' } = {}) => {
    const target = new URL(href, page.url);
    const same = target.pathname === page.url.pathname;
    void goto(resolve((target.pathname + target.search) as '/'), {
      replaceState: same && opts.history !== 'push',
      noScroll: same,
      keepFocus: same,
    });
  };
</script>

<OwnerWorkspace {api} {view} app={APP} url={page.url} {navigate} {capture} {sim}>
  {#snippet video(props)}<OwnerVideo {...props} />{/snippet}
  {#snippet map(scene)}
    <div class="rounded-card h-full w-full min-w-0 flex-1 overflow-hidden" aria-label="보유 장비 위치 지도">
      <MapView
        markers={ownerMarkers(scene)}
        camera={ownerCamera(scene)}
        {...ownerBasemap(scene)}
        animate={scene.animate}
        level={scene.level}
        styleUrl={dark ? STYLE.dark : STYLE.light}
        labelLocale="ko"
        onselect={(id, kind) => scene.onselect?.(kind, id)}
        class="h-full"
      />
    </div>
  {/snippet}
  {#snippet live(camera, label, capture, fill)}
    <OwnerLiveTile {camera} {label} {capture} {fill} />
  {/snippet}
  {#snippet aiShot(event)}<AiEventShot {event} />{/snippet}
</OwnerWorkspace>
