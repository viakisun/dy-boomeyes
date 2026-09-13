<script lang="ts">
  // 종 알림 패널 — 고장·지연·점검을 시간순 한 줄로 모은다(시안 «결정 2026-09-12»).
  // 알림은 좌측 메뉴에서 내려와 여기로 들어온다. 패널은 비모달이라 뒤 화면을 막지 않는다.
  // 웹은 종 아래에 붙는 드롭다운, PWA는 390px에서 드롭다운이 화면을 덮으므로 전체 폭 시트다.
  import { ownerHref, type OwnerAlert, type OwnerApp, type OwnerDevice } from '@boomeyes/domain';
  import Bell from '@lucide/svelte/icons/bell';
  import { cx } from '../lib/cx';
  import IconButton from '../primitives/IconButton.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import AlertCard from './AlertCard.svelte';
  import { ownerLink } from './core-helpers';
  let {
    alerts,
    devices,
    now,
    app,
    url,
  }: {
    alerts: OwnerAlert[];
    devices: Pick<OwnerDevice, 'id' | 'unit' | 'site'>[];
    now: string;
    app: OwnerApp;
    url: URL;
  } = $props();
  let open = $state(false);
  let root = $state<HTMLDivElement>();
  const sheet = $derived(app === 'pwa');
  const unread = $derived(alerts.filter((a) => !a.read).length);
  // 시간순 — 같은 시각이면 미확인 먼저
  const ordered = $derived(
    [...alerts].sort((a, b) => b.at.localeCompare(a.at) || Number(a.read) - Number(b.read)).slice(0, 6),
  );
  const label = $derived(unread ? `알림 ${unread}건 미확인` : '알림');
  function close(focus = true) {
    if (!open) return;
    open = false;
    // IconButton은 element를 노출하지 않는다 — 루트 안의 트리거 버튼으로 포커스를 되돌린다
    if (focus) root?.querySelector<HTMLButtonElement>('button[aria-controls="owner-alert-panel"]')?.focus();
  }
  $effect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (root && !root.contains(e.target as Node)) close(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    // 터치에서도 바깥을 누르면 닫힌다 — mousedown만 듣던 Menu의 한계를 되풀이하지 않는다
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  });
</script>

<div bind:this={root} class="relative inline-block">
  <IconButton
    variant="ghost"
    tone="neutral"
    {label}
    aria-expanded={open}
    aria-controls="owner-alert-panel"
    aria-haspopup="dialog"
    class="min-w-size-touch-min relative {open ? 'text-accent-fg bg-selected' : ''}"
    onclick={() => (open ? close() : (open = true))}
  >
    <Bell class="size-size-icon-md" aria-hidden="true" />
    {#if unread}
      <span
        aria-hidden="true"
        class="bg-danger text-danger-on-solid rounded-pill text-label-sm px-inline-xs absolute top-0 right-0 font-semibold tabular-nums"
      >
        {unread}
      </span>
    {/if}
  </IconButton>
  {#if open}
    <section
      id="owner-alert-panel"
      data-owner-bell
      aria-label="알림"
      class={cx(
        'border-border bg-surface-raised rounded-dialog shadow-overlay gap-stack-sm flex flex-col border',
        sheet
          ? 'p-inset-md top-layout-topbar-height inset-x-inset-sm max-h-layout-panel-height fixed overflow-y-auto'
          : 'p-inset-md mt-stack-xs w-layout-inspector-width max-h-layout-panel-height absolute right-0 overflow-y-auto',
      )}
      style="z-index: var(--sys-z-dropdown)"
    >
      <div class="gap-inline-md flex items-baseline justify-between">
        <h2 class="text-heading-sm">알림</h2>
        <span class="text-body-sm text-fg-muted tabular-nums">{unread ? `미확인 ${unread}건` : '모두 확인함'}</span>
      </div>
      {#if ordered.length}
        <ul class="gap-stack-xs flex list-none flex-col p-0">
          {#each ordered as alert (alert.id)}
            <li>
              <AlertCard
                {alert}
                device={devices.find((d) => d.id === alert.deviceId)}
                {now}
                href={ownerHref(url, 'alerts', app, { alert: alert.id })}
                data-alert={alert.id}
                data-device={alert.deviceId}
                onclick={() => close(false)}
              />
            </li>
          {/each}
        </ul>
        <a class={cx(ownerLink(), 'self-start')} href={ownerHref(url, 'alerts', app)} onclick={() => close(false)}>
          알림 전체 보기
        </a>
      {:else}
        <EmptyState title="확인할 알림이 없습니다" description="고장·수신 지연·점검 시기가 생기면 여기에 모입니다." />
      {/if}
    </section>
  {/if}
</div>
