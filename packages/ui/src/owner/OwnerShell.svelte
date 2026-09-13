<script lang="ts">
  import type { Snippet } from 'svelte';
  import { OWNER_DEMO, OWNER_MENU, ownerHref, type OwnerApp, type OwnerView } from '@boomeyes/domain';
  import Logo from '../brand/Logo.svelte';
  import IconButton from '../primitives/IconButton.svelte';
  import Banner from '../primitives/Banner.svelte';
  import Moon from '@lucide/svelte/icons/moon';
  import Sun from '@lucide/svelte/icons/sun';
  import LogOut from '@lucide/svelte/icons/log-out';
  import WifiOff from '@lucide/svelte/icons/wifi-off';
  import Activity from '@lucide/svelte/icons/activity';
  import { NAV_ICON } from '../shell/nav-icons';
  import { theme, toggleTheme } from '../lib/theme.svelte';
  import { ownerControl } from './core-helpers';
  import { connectivity } from '../lib/connectivity.svelte';
  import AlertBell from './AlertBell.svelte';
  import Badge from '../primitives/Badge.svelte';
  import { provideBell } from './bell.svelte';
  let {
    app,
    view,
    url,
    onlogout,
    sim = false,
    onsim,
    children,
  }: {
    app: OwnerApp;
    view: OwnerView;
    url: URL;
    onlogout: () => void;
    /** 활동 시뮬레이션 상태·토글(시연자용 — 함대가 시간에 따라 움직인다) */
    sim?: boolean;
    onsim?: (on: boolean) => void;
    children: Snippet;
  } = $props();
  // 메뉴 항목은 원천(owner_demo menu > 0)에서 온다 — 하단 내비의 열 수도 여기서 파생한다(고정 4칸 금지)
  const items = $derived(OWNER_MENU.map((v) => OWNER_DEMO.find((x) => x.view === v)!));
  const active = $derived(view === 'detail' || view === 'video' ? 'fleet' : view);
  const dark = $derived(theme.value ? theme.value === 'dark' : theme.system);
  // 알림 자료 통로 — 워크스페이스가 읽은 스냅샷을 헤더의 종으로 올린다
  const bell = provideBell();
  // 레일의 「계약」에 새 요청 배지(시안 «확정 2026-09-12») — 아직 배정하지 않은 요청이 있다는 신호다.
  // 수는 링크의 *설명*(aria-describedby)으로 붙인다. 이름에 섞으면 「계약」이 「계약 새 요청 3건」이
  // 되어 내비 링크를 exact로 찾는 시험이 깨지고, 메뉴 이름 자체가 수에 따라 흔들린다.
  // 그래서 설명 문구는 링크 **밖**에 둔다 — 링크 안에 있으면 aria-hidden이 아닌 한 이름에 섞이고,
  // aria-hidden이면 aria-describedby가 가리켜도 읽히지 않는다. 배지 자체는 장식(aria-hidden)이다.
  const badgeOf = (view: OwnerView) => (view === 'requests' && bell.newRequests > 0 ? bell.newRequests : 0);
</script>

{#snippet navigation()}
  {#each items as item (item.view)}
    {@const Icon = NAV_ICON[item[app]]}
    <a
      href={ownerHref(url, item.view, app)}
      aria-current={active === item.view ? 'page' : undefined}
      aria-describedby={badgeOf(item.view) > 0 ? `owner-nav-badge-bar-${item.view}` : undefined}
      class="owner-nav-link gap-inline-sm rounded-control px-inset-md py-inset-sm text-label-md relative flex min-w-0 items-center font-semibold {active ===
      item.view
        ? 'bg-selected text-accent-fg'
        : 'text-fg-muted hover:bg-ui-hover'}"
    >
      <Icon class="size-size-icon-lg shrink-0" aria-hidden="true" /><span>{item.label}</span>
      <!-- 배지는 흐름 밖에 둔다 — 하단 바의 링크는 세로 스택이라 흐름에 두면 그 칸만 높아진다 -->
      {#if badgeOf(item.view) > 0}
        <span data-owner-nav-badge aria-hidden="true" class="top-inset-xs right-inset-xs absolute"
          ><Badge tone="danger" variant="solid" count={badgeOf(item.view)} /></span
        >
      {/if}
    </a>
    {#if badgeOf(item.view) > 0}
      <span id="owner-nav-badge-bar-{item.view}" class="sr-only">새 요청 {badgeOf(item.view)}건</span>
    {/if}
  {/each}
{/snippet}

<div class="bg-canvas text-fg flex min-h-dvh" data-owner-root data-owner-app={app} data-density="comfortable">
  {#if app === 'web'}
    <aside
      class="border-border-subtle bg-surface w-layout-sidebar-collapsed gap-stack-lg py-inset-md sticky top-0 hidden h-dvh shrink-0 flex-col items-center border-r lg:flex"
    >
      <a
        href={ownerHref(url, 'overview', app)}
        aria-label="BoomEyes 홈"
        class="{ownerControl()} rounded-control flex items-center justify-center"
        ><Logo class="size-size-avatar-sm" variant="glyph" /></a
      >
      <nav aria-label="소유주 메뉴" class="gap-stack-xs flex w-full flex-col items-stretch">
        {#each items as item (item.view)}
          {@const Icon = NAV_ICON[item[app]]}
          <a
            href={ownerHref(url, item.view, app)}
            aria-current={active === item.view ? 'page' : undefined}
            aria-describedby={badgeOf(item.view) > 0 ? `owner-nav-badge-rail-${item.view}` : undefined}
            title={badgeOf(item.view) > 0 ? `${item.label} · 새 요청 ${badgeOf(item.view)}건` : item.label}
            class="owner-nav-link gap-stack-xs rounded-control py-inset-xs text-label-sm mx-inset-xs relative flex flex-col items-center justify-center text-center {active ===
            item.view
              ? 'bg-selected text-accent-fg'
              : 'text-fg-muted hover:bg-ui-hover'}"
          >
            <Icon class="size-size-icon-lg shrink-0" aria-hidden="true" />
            <span class="truncate">{item.label}</span>
            {#if badgeOf(item.view) > 0}
              <span data-owner-nav-badge aria-hidden="true" class="top-inset-xs right-inset-xs absolute"
                ><Badge tone="danger" variant="solid" count={badgeOf(item.view)} /></span
              >
            {/if}
          </a>
          {#if badgeOf(item.view) > 0}
            <span id="owner-nav-badge-rail-{item.view}" class="sr-only">새 요청 {badgeOf(item.view)}건</span>
          {/if}
        {/each}
      </nav>
    </aside>
  {/if}
  <div class="flex min-w-0 flex-1 flex-col">
    <header
      class="border-border-subtle bg-surface gap-inline-sm px-page-gutter py-inset-sm flex flex-wrap items-center justify-between border-b"
    >
      <div class="gap-inline-sm flex items-center">
        <Logo variant="glyph" class="size-size-avatar-sm" />
        <span class="text-label-lg font-semibold">소유주 운영</span>
      </div>
      <!-- 종이 늘면서 200% 확대에서 아이콘 줄이 넘쳤다 — 줄바꿈을 허용한다 -->
      <div class="gap-inline-xs flex flex-wrap justify-end">
        <!-- 알림은 메뉴에서 내려와 헤더의 종으로 들어온다(시안 «결정 2026-09-12») -->
        <AlertBell alerts={bell.alerts} devices={bell.devices} now={bell.now} {app} {url} />
        {#if onsim}
          <IconButton
            variant="ghost"
            tone="neutral"
            label={sim ? '활동 시뮬레이션 끄기' : '활동 시뮬레이션 켜기'}
            aria-pressed={sim}
            class="min-w-size-touch-min {sim ? 'text-accent-fg bg-selected' : ''}"
            onclick={() => onsim(!sim)}><Activity class="size-size-icon-md" aria-hidden="true" /></IconButton
          >
        {/if}
        <IconButton
          variant="ghost"
          tone="neutral"
          label={dark ? '라이트 모드' : '다크 모드'}
          class="min-w-size-touch-min"
          onclick={toggleTheme}
          >{#if dark}<Sun class="size-size-icon-md" aria-hidden="true" />{:else}<Moon
              class="size-size-icon-md"
              aria-hidden="true"
            />{/if}</IconButton
        >
        <IconButton variant="ghost" tone="neutral" label="로그아웃" class="min-w-size-touch-min" onclick={onlogout}
          ><LogOut class="size-size-icon-md" aria-hidden="true" /></IconButton
        >
      </div>
    </header>
    {#if !connectivity.online}
      <Banner tone="warning" class="mx-page-gutter mt-inset-sm">
        {#snippet icon()}<WifiOff class="size-size-icon-md" aria-hidden="true" />{/snippet}오프라인 · 마지막으로 불러온
        화면입니다.
      </Banner>
    {/if}
    <main data-owner-scroll class="p-page-gutter flex w-full min-w-0 flex-1 flex-col">
      {@render children()}
    </main>
    <nav
      aria-label="소유주 메뉴"
      style="grid-template-columns: repeat({items.length}, minmax(0, 1fr))"
      class="owner-mobile-nav border-border-subtle bg-surface gap-inline-xs p-inset-xs sticky bottom-0 grid border-t {app ===
      'web'
        ? 'lg:hidden'
        : ''}"
    >
      {@render navigation()}
    </nav>
  </div>
</div>

<style>
  :global([data-owner-root] button),
  :global([data-owner-root] select),
  :global([data-owner-root] input:not([type='file']):not([type='checkbox']):not([type='radio'])),
  :global([data-owner-root] .owner-nav-link) {
    min-height: max(var(--sys-size-touch-min), var(--sys-size-control-md));
  }
  :global([data-owner-root] button) {
    white-space: normal;
  }
  :global([data-owner-root] a:focus-visible),
  :global([data-owner-root] button:focus-visible),
  :global([data-owner-root] select:focus-visible),
  :global([data-owner-root] input:focus-visible) {
    outline: var(--sys-border-width-focus) solid var(--sys-color-accent-solid);
    outline-offset: var(--sys-space-stack-xs);
  }
  .owner-mobile-nav {
    padding-bottom: max(var(--sys-space-inset-xs), env(safe-area-inset-bottom));
  }
  .owner-mobile-nav :global(a) {
    flex-direction: column;
    gap: var(--sys-space-stack-xs);
    padding-inline: var(--sys-space-inset-xs);
    text-align: center;
  }
</style>
