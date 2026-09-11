<script lang="ts">
  // 담당자 — 이니셜 아바타 · 이름 · 역할 · 전화(tel:, 번호 텍스트 유지) · 복사. 미등록은 호출자가 문구를 보여준다.
  import type { Snippet } from 'svelte';
  import Phone from '@lucide/svelte/icons/phone';
  import Copy from '@lucide/svelte/icons/copy';
  import { cx } from '../lib/cx';
  import Button from './Button.svelte';
  import IconButton from './IconButton.svelte';
  import { toast } from './toast-store.svelte';
  let {
    name,
    role,
    phone,
    note,
    copy = true,
    actions,
    class: cls,
  }: {
    name: string;
    role?: string;
    phone?: string;
    note?: string;
    copy?: boolean;
    actions?: Snippet;
    class?: string;
  } = $props();
  const digits = $derived(phone?.replace(/[^+\d]/g, '') ?? '');
  async function copyPhone() {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      toast('전화번호를 복사했습니다.');
    } catch {
      toast('복사하지 못했습니다.');
    }
  }
</script>

<div class={cx('gap-stack-md flex min-w-0 flex-col', cls)}>
  <div class="gap-inline-md flex min-w-0 items-center">
    <span
      class="size-size-avatar-lg rounded-pill bg-ui text-label-lg inline-flex shrink-0 items-center justify-center"
      aria-hidden="true">{name.slice(0, 1)}</span
    >
    <span class="gap-stack-xs flex min-w-0 flex-col">
      <span class="text-heading-sm break-words">{name}</span>
      {#if role || note}<span class="text-body-sm text-fg-muted break-words"
          >{[role, note].filter(Boolean).join(' · ')}</span
        >{/if}
    </span>
  </div>
  {#if phone || actions}
    <div class="gap-inline-sm flex flex-wrap items-center">
      {#if phone}
        <Button variant="outline" tone="neutral" href="tel:{digits}"
          ><Phone class="size-size-icon-sm" aria-hidden="true" />{phone}</Button
        >
        {#if copy}<IconButton variant="outline" label="전화번호 복사" class="min-w-size-touch-min" onclick={copyPhone}
            ><Copy class="size-size-icon-sm" aria-hidden="true" /></IconButton
          >{/if}
      {/if}
      {@render actions?.()}
    </div>
  {/if}
</div>
