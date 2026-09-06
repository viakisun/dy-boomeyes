<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '../primitives/Button.svelte';
  import AppBar from './AppBar.svelte';
  import BottomNav from './BottomNav.svelte';
  import type { NavItem } from './nav';
  // PWA 셸: 앱바 56 · 콘텐츠(좌우 20) · 하단 내비 56+safe-area · 배너 슬롯 · 시트 호스트 (DY-design §10)
  // 큐 배너(ADR-010 · QA §2): 오프라인 · 동기 대기 n건(지금 동기) · 전송 실패 n건(재시도) — 문구는 이 셋만
  let {
    title,
    back,
    align = 'left',
    tabs = [],
    offline = false,
    queued = 0,
    failed = 0,
    syncing = false,
    onsync,
    banner,
    actions,
    logo,
    sheet,
    bar,
    children,
  }: {
    title?: string;
    back?: { href: string; label?: string };
    align?: 'left' | 'center';
    tabs?: NavItem[];
    offline?: boolean;
    /** 아웃박스 대기 건수 */
    queued?: number;
    /** 전송 실패(백오프 소진) 건수 */
    failed?: number;
    syncing?: boolean;
    /** "지금 동기" · "재시도" */
    onsync?: () => void;
    banner?: Snippet;
    actions?: Snippet;
    logo?: Snippet;
    sheet?: Snippet;
    /** 하단 내비 위 고정 바(시연 장면 바) */
    bar?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<div class="max-w-layout-frame-mobile bg-canvas text-fg mx-auto flex min-h-dvh w-full flex-col" data-capture-frame>
  <AppBar {title} {back} {align} {actions} {logo} />
  {#if offline || queued || failed}
    <div
      role="status"
      class={failed && !offline
        ? 'bg-danger-bg px-page-gutter py-inset-xs text-body-sm text-danger-fg gap-inline-sm flex items-center'
        : 'bg-neutral-bg px-page-gutter py-inset-xs text-body-sm text-neutral-fg gap-inline-sm flex items-center'}
      data-outbox={offline ? 'offline' : failed ? 'failed' : 'queued'}
    >
      <span class="flex-1">
        {#if offline}
          오프라인 — {queued ? `동기 대기 ${queued}건 · 연결 후 전송` : '저장한 작업은 연결 후 동기화됩니다'}
        {:else if failed}
          전송 실패 {failed}건{queued ? ` · 동기 대기 ${queued}건` : ''}
        {:else}
          동기 대기 {queued}건
        {/if}
      </span>
      {#if !offline}
        <Button size="sm" variant="outline" tone="neutral" disabled={syncing} onclick={onsync}
          >{syncing ? '동기 중…' : failed ? '재시도' : '지금 동기'}</Button
        >
      {/if}
    </div>
  {/if}
  {#if banner}<div class="px-page-gutter pt-stack-sm">{@render banner()}</div>{/if}
  <main class="px-page-gutter py-stack-md flex-1">{@render children?.()}</main>
  {#if bar}{@render bar()}{/if}
  {#if tabs.length}<BottomNav items={tabs} />{/if}
  {#if sheet}{@render sheet()}{/if}
</div>
