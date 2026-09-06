<script lang="ts">
  // 미구현 화면 자리(웨이브 > 현재) · 알 수 없는 경로 — 루트 data-stub로 capture --strict가 자리 화면을 센다
  import { SCREENS } from '@boomeyes/domain';
  import { EmptyState } from '@boomeyes/ui';
  let { data } = $props();
  const s = $derived(data.screen ? SCREENS[data.screen] : undefined);
</script>

<div data-scr={data.screen} data-stub>
  {#if s}
    <EmptyState title={s.name} description="준비 중인 화면입니다" />
  {:else}
    <EmptyState title="없는 화면입니다" description="ssot/screens.yaml에 등록된 라우트가 아닙니다." tone="danger" />
  {/if}
</div>
