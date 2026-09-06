<script lang="ts">
  // 출근 카드 — 미체크인 → 큰 체크인 버튼(48px) · 근무 중 → 시각 + 체크아웃 · 퇴근 후 요약 (FR-013) · pending이면 "동기 대기"(ADR-010)
  import type { Attendance } from '@boomeyes/domain';
  import { fmtTime } from '../lib/format';
  import Button from './Button.svelte';
  import StatusPill from './StatusPill.svelte';
  let {
    attendance,
    siteName,
    busy = false,
    oncheckin,
    oncheckout,
  }: {
    attendance: Attendance;
    siteName?: string;
    busy?: boolean;
    oncheckin?: () => void;
    oncheckout?: () => void;
  } = $props();
  const phase = $derived(attendance.checkoutAt ? 'out' : attendance.checkinAt ? 'in' : 'none');
</script>

<section
  class="rounded-card border-border bg-surface p-inset-md gap-stack-sm flex flex-col border"
  aria-label="출근"
  data-phase={phase}
>
  <div class="flex items-center justify-between">
    <span class="text-heading-sm">출근</span>
    {#if phase === 'none'}<StatusPill tone="neutral" label="미체크인" size="sm" />
    {:else if phase === 'in'}<StatusPill
        tone={attendance.pending ? 'warning' : 'success'}
        label="{attendance.pending ? '동기 대기' : '근무 중'} · {fmtTime(attendance.checkinAt ?? '')}"
        size="sm"
      />
    {:else}<StatusPill
        tone={attendance.pending ? 'warning' : 'neutral'}
        label="퇴근 {fmtTime(attendance.checkoutAt ?? '')}{attendance.pending ? ' · 동기 대기' : ''}"
        size="sm"
      />{/if}
  </div>
  {#if siteName}<span class="text-body-sm text-fg-muted">{siteName} · 현장 반경 안에서만 체크인됩니다</span>{/if}
  {#if phase === 'none'}
    <Button size="lg" block disabled={busy} onclick={oncheckin}>출근 체크인</Button>
  {:else if phase === 'in'}
    <Button size="lg" block variant="outline" tone="neutral" disabled={busy} onclick={oncheckout}>퇴근 체크아웃</Button>
  {:else}
    <span class="text-body-sm text-fg-muted">오늘 근무가 끝났습니다. 수고하셨습니다.</span>
  {/if}
</section>
