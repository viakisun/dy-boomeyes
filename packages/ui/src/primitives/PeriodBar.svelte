<script lang="ts">
  // 기간 막대 — 양끝 <time> · 트랙(경과 채움 중립) · 오늘 마커(rounded-mark, 점 감사 제외) · 보조 마커 눈금 · 캡션 "종료까지 D-n"(≤ warnWithinDays warning).
  // 절대 위치 텍스트 없음(375px 오버플로 방지). now는 DemoClock(data.at).
  import { cx } from '../lib/cx';
  import { periodPosition, periodProgress } from '../lib/period';
  let {
    start,
    end,
    now,
    label,
    format = (iso: string) => iso.slice(0, 10),
    markers = [],
    warnWithinDays = 30,
    class: cls,
  }: {
    start: string;
    end: string;
    now: string;
    label: string;
    format?: (iso: string) => string;
    markers?: { at: string; label: string }[];
    warnWithinDays?: number;
    class?: string;
  } = $props();
  const p = $derived(periodProgress(start, end, now));
  const warn = $derived(p.state === 'after' || p.remainingDays <= warnWithinDays);
  const caption = $derived(
    p.state === 'after'
      ? `종료 D+${-p.remainingDays}`
      : p.state === 'before'
        ? '시작 전'
        : `종료까지 D-${p.remainingDays}`,
  );
  const ticks = $derived(
    markers.map((m) => ({ ...m, pos: periodPosition(m.at, start, end) })).filter((m) => m.pos !== null),
  );
</script>

<div class={cx('gap-stack-xs flex flex-col', cls)} role="group" aria-label={label}>
  <div class="text-label-md flex justify-between tabular-nums">
    <time datetime={start}>{format(start)}</time>
    <time datetime={end}>{format(end)}</time>
  </div>
  <div class="h-size-indicator rounded-pill bg-surface-sunken relative">
    <span class="rounded-pill bg-neutral absolute inset-y-0 left-0" style:width="{p.pct}%"></span>
    {#each ticks as m (m.at)}
      <span class="bg-border-strong absolute inset-y-0 w-px" style:left="{m.pos}%" title={m.label}></span>
    {/each}
    {#if p.state === 'during'}
      <span
        class="rounded-mark bg-fg size-size-icon-sm absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        style:left="{p.pct}%"
        aria-hidden="true"
      ></span>
    {/if}
  </div>
  <div class="text-body-sm text-fg-muted flex justify-between">
    <span>{ticks.map((m) => `${m.label} ${format(m.at)}`).join(' · ') || ''}</span>
    <span class={cx('tabular-nums', warn && 'text-warning-fg font-medium')}>{caption}</span>
  </div>
</div>
