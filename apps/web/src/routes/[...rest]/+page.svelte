<script lang="ts">
  // 미구현 화면 자리(웨이브 > 현재) · 알 수 없는 경로
  import { CURRENT_WAVE, SCREENS } from '@boomeyes/domain';
  import { EmptyState } from '@boomeyes/ui';
  let { data } = $props();
  const s = $derived(data.screen ? SCREENS[data.screen] : undefined);
</script>

<div data-scr={data.screen}>
  {#if s}
    <EmptyState
      title="{data.screen} {s.name}"
      description="웨이브 {s.wave}에서 구현됩니다 (현재 웨이브 {CURRENT_WAVE})."
    />
  {:else}
    <EmptyState title="없는 화면입니다" description="ssot/screens.yaml에 등록된 라우트가 아닙니다." tone="danger" />
  {/if}
</div>
