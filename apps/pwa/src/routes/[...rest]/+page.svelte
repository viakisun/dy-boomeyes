<script lang="ts">
  import { CURRENT_WAVE, SCREENS } from '@boomeyes/domain';
  import { EmptyState } from '@boomeyes/ui';
  let { data } = $props();
  const s = $derived(data.screen ? SCREENS[data.screen] : undefined);
</script>

{#if s}
  <EmptyState
    title="{data.screen} {s.name}"
    description="웨이브 {s.wave}에서 구현됩니다 (현재 웨이브 {CURRENT_WAVE})."
  />
{:else}
  <EmptyState title="없는 화면입니다" tone="danger" />
{/if}
