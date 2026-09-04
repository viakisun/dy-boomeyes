<script lang="ts">
  import { cx, TONE, type Tone } from '../lib/cx';
  let {
    tone,
    pulse = false,
    label,
    class: cls,
  }: { tone: Tone; pulse?: boolean; label?: string; class?: string } = $props();
</script>

<span
  class={cx('size-size-indicator relative inline-flex shrink-0', cls)}
  role={label ? 'img' : undefined}
  aria-label={label}
>
  {#if pulse}<span class={cx('rounded-pill absolute inline-flex size-full animate-ping opacity-60', TONE[tone].dot)}
    ></span>{/if}
  <span class={cx('rounded-pill relative inline-flex size-full', TONE[tone].dot)}></span>
</span>
