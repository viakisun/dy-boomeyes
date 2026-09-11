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
  import { NAV_ICON } from '../shell/nav-icons';
  import { theme, toggleTheme } from '../lib/theme.svelte';
  import { connectivity } from '../lib/connectivity.svelte';
  let {
    app,
    view,
    url,
    onlogout,
    children,
  }: { app: OwnerApp; view: OwnerView; url: URL; onlogout: () => void; children: Snippet } = $props();
  const items = $derived(OWNER_MENU.map((v) => OWNER_DEMO.find((x) => x.view === v)!));
  const active = $derived(view === 'detail' || view === 'video' ? 'fleet' : view);
  const dark = $derived(theme.value ? theme.value === 'dark' : theme.system);
</script>

{#snippet navigation()}
  {#each items as item (item.view)}
    {@const Icon = NAV_ICON[item[app]]}
    <a
      href={ownerHref(url, item.view, app)}
      aria-current={active === item.view ? 'page' : undefined}
      class="owner-nav-link gap-inline-sm rounded-control px-inset-md py-inset-sm text-label-md flex min-w-0 items-center font-semibold {active ===
      item.view
        ? 'bg-selected text-accent-fg'
        : 'text-fg-muted hover:bg-ui-hover'}"
    >
      <Icon class="size-size-icon-lg shrink-0" aria-hidden="true" /><span>{item.label}</span>
    </a>
  {/each}
{/snippet}

<div class="bg-canvas text-fg flex min-h-dvh" data-owner-root data-owner-app={app} data-density="comfortable">
  {#if app === 'web'}
    <aside
      class="border-border-subtle bg-surface w-layout-sidebar-width p-inset-xl sticky top-0 hidden h-dvh shrink-0 flex-col border-r lg:flex"
    >
      <a href={ownerHref(url, 'overview', app)} aria-label="BoomEyes 홈" class="py-inset-md"
        ><Logo class="h-size-avatar-md w-auto" variant="lockup" /></a
      >
      <p class="text-label-sm text-fg-muted mt-stack-xl mb-stack-sm">소유주 운영</p>
      <nav aria-label="소유주 메뉴" class="gap-stack-xs flex flex-col">{@render navigation()}</nav>
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
      <div class="gap-inline-xs flex">
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
    <main data-owner-scroll class="p-page-gutter max-w-layout-container-max mx-auto w-full min-w-0 flex-1">
      {@render children()}
    </main>
    <nav
      aria-label="소유주 메뉴"
      class="owner-mobile-nav border-border-subtle bg-surface gap-inline-xs p-inset-xs sticky bottom-0 grid grid-cols-4 border-t {app ===
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
