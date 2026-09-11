<script lang="ts">
  import type { OwnerApp } from '@boomeyes/domain';
  import Logo from '../brand/Logo.svelte';
  import Button from '../primitives/Button.svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Truck from '@lucide/svelte/icons/truck';
  import Check from '@lucide/svelte/icons/check';
  let { app, onstart, screen }: { app: OwnerApp; onstart: () => Promise<void>; screen: string } = $props();
  let busy = $state(false);
  let error = $state('');
  async function start() {
    busy = true;
    error = '';
    try {
      await onstart();
    } catch {
      error = '데모를 시작하지 못했습니다. 다시 시도해 주세요.';
    } finally {
      busy = false;
    }
  }
</script>

<main
  data-scr={screen}
  data-owner-view="entry"
  data-owner-root
  data-owner-app={app}
  data-density="comfortable"
  class="bg-canvas text-fg p-page-gutter flex min-h-dvh flex-col"
>
  <header class="max-w-layout-container-max py-stack-lg gap-inline-sm mx-auto flex w-full items-center justify-between">
    <Logo variant="lockup" color label="BoomEyes" class="h-size-avatar-md w-auto" />
    <span class="text-label-md text-fg-muted">소유주 데모</span>
  </header>
  <div
    class="max-w-layout-container-max gap-stack-xl py-stack-xl mx-auto grid w-full flex-1 items-center lg:grid-cols-2"
  >
    <section class="gap-stack-xl max-w-layout-prose-width flex flex-col">
      <p class="text-accent-fg text-label-lg font-semibold">보유 장비, 한눈에</p>
      <h1 class="text-display-lg tracking-tight">전국의 장비를<br />내 손안에서.</h1>
      <p class="text-body-lg text-fg-muted">
        어느 현장에 있는지, 누구에게 연락할지.<br />장비를 찾고 계약과 서류까지 확인하세요.
      </p>
      <div class="gap-stack-sm flex flex-col">
        <Button class="min-h-size-touch-min w-full" size="lg" onclick={start} loading={busy}
          >데모 시작하기 <ArrowRight class="size-size-icon-lg" aria-hidden="true" /></Button
        >
        {#if error}<p role="alert" class="text-danger-fg text-body-md">{error}</p>{/if}
      </div>
    </section>
    <section
      class="rounded-card border-border-subtle bg-surface shadow-card p-inset-xl border"
      aria-label="소유주 화면 미리보기"
    >
      <div class="gap-inline-md mb-stack-lg flex items-center justify-between">
        <span class="text-heading-md">한빛중기 운영 현황</span>
      </div>
      <div class="border-border-subtle pb-stack-xl gap-inline-md flex items-end border-b">
        <div>
          <p class="text-label-md text-fg-muted">전체 보유</p>
          <p class="text-display-lg">5<span class="text-heading-md text-fg-muted">대</span></p>
        </div>
        <p class="text-body-md text-fg-muted pb-stack-xs">현장 투입 4 · 보관 1</p>
      </div>
      <div class="gap-stack-md py-stack-xl flex flex-col">
        <div class="gap-inline-md flex items-center">
          <Truck class="text-accent-fg size-size-icon-xl" aria-hidden="true" />
          <div>
            <p class="text-heading-md">1호기 · 마포 주상복합</p>
            <p class="text-body-md text-fg-muted">현장 투입 · 최근 수신</p>
          </div>
          <Check class="text-fg-muted size-size-icon-lg ml-auto" aria-label="수신 정상" />
        </div>
        <dl class="bg-surface-sunken rounded-control gap-stack-sm p-inset-lg text-body-md grid grid-cols-2">
          <dt class="text-fg-muted">계약 종료</dt>
          <dd class="text-right font-semibold">2026. 9. 30.</dd>
          <dt class="text-fg-muted">현장 담당자</dt>
          <dd class="text-right font-semibold">김현장</dd>
        </dl>
      </div>
      <div
        class="border-border-subtle pt-stack-lg text-body-md gap-inline-sm flex items-center justify-between border-t"
      >
        <span>2호기 · 공급 전압 확인 필요</span><span class="text-warning-fg font-semibold">확인 1건</span>
      </div>
    </section>
  </div>
  <footer class="text-body-sm text-fg-muted max-w-layout-container-max py-stack-lg mx-auto w-full">
    시연용 데이터와 영상입니다. 실제 장비에 연결되지 않습니다.
  </footer>
</main>
