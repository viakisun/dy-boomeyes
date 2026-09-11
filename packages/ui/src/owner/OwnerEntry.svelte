<script lang="ts">
  // 소유주 진입 — 로그인 화면. 로고 · 제목 · 데모 시작 버튼. 입력란·가입·회사 선택은 시연에 불필요한 장식이라 두지 않는다(디자인 진단 §4).
  import type { OwnerApp } from '@boomeyes/domain';
  import Logo from '../brand/Logo.svelte';
  import Button from '../primitives/Button.svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
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
  class="bg-canvas text-fg p-page-gutter flex min-h-dvh flex-col items-center justify-center"
>
  <section
    class="rounded-card bg-surface shadow-raised p-inset-xl gap-stack-lg max-w-layout-form-max flex w-full flex-col items-center text-center"
    aria-labelledby="owner-entry-title"
  >
    <Logo variant="lockup" color label="BoomEyes" class="h-size-avatar-lg w-auto" />
    <div class="gap-stack-xs flex flex-col">
      <h1 id="owner-entry-title" class="text-heading-xl">소유주 로그인</h1>
      <p class="text-body-md text-fg-muted">보유 장비 · 계약 · 서류 · 현장 영상</p>
    </div>
    <Button class="w-full" size="lg" onclick={start} loading={busy}
      >데모 시작하기 <ArrowRight class="size-size-icon-lg" aria-hidden="true" /></Button
    >
    {#if error}<p role="alert" class="text-danger-fg text-body-md">{error}</p>{/if}
    <p class="text-body-sm text-fg-muted">시연용 데이터 · 실제 장비에 연결되지 않음</p>
  </section>
</main>
