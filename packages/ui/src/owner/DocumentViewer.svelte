<script lang="ts">
  import type { OwnerDocument } from '@boomeyes/domain';
  import Button from '../primitives/Button.svelte';
  import { FOCUS } from '../lib/cx';
  let {
    document: record,
    onclose,
    compact = false,
  }: {
    document: OwnerDocument;
    onclose?: () => void;
    compact?: boolean;
  } = $props();
  let failed = $state(false);
  let revision = $state(0);
  $effect(() => {
    void record.id;
    failed = false;
  });
</script>

<section
  class="border-border bg-surface rounded-card min-w-0 overflow-hidden border"
  data-document-viewer
  data-doc={record.id}
  aria-label="{record.deviceId} {record.title} 원문"
>
  <div class="border-border gap-stack-md p-inset-lg flex flex-wrap items-start justify-between border-b">
    <div class="gap-stack-xs flex min-w-0 flex-col">
      <p class="text-label-md text-fg-muted">
        {record.deviceId} · {record.type === 'application/pdf' ? 'PDF' : '이미지'}
      </p>
      <h2 class="text-heading-sm break-words">{record.title}</h2>
      <p class="text-label-md text-fg-muted">
        {record.sessionOnly ? '시연용 첨부 · 첫 페이지 미리보기' : '시연용 원문 · 1페이지'}
      </p>
    </div>
    <div class="gap-inline-sm flex flex-wrap">
      <a
        class="{FOCUS} border-border-strong rounded-control text-label-lg px-inset-md inline-flex min-h-[max(var(--sys-size-touch-min),var(--sys-size-control-md))] items-center border"
        href={record.url}
        target="_blank"
        rel="noopener noreferrer">원문 새 창 열기</a
      >
      {#if onclose}<Button variant="ghost" tone="neutral" class="min-h-size-touch-min" onclick={onclose}
          >서류 목록으로</Button
        >{/if}
    </div>
  </div>
  {#if failed}
    <div class="p-inset-xl gap-stack-md flex flex-col items-start" role="alert">
      <p class="text-body-md">원문을 불러오지 못했습니다.</p>
      <p class="text-body-sm text-fg-muted">연결 상태를 확인한 뒤 다시 열어 주세요.</p>
      <Button
        class="min-h-size-touch-min"
        onclick={() => {
          revision++;
          failed = false;
        }}>다시 불러오기</Button
      >
    </div>
  {:else}
    {#key `${record.id}-${revision}`}
      <div class="bg-surface-sunken p-inset-sm overflow-auto" class:max-h-layout-panel-height={compact}>
        {#if record.previewUrl || record.type !== 'application/pdf'}
          <img
            src={record.previewUrl ?? record.url}
            alt="{record.deviceId} {record.title} 원문"
            class="max-w-layout-form-max mx-auto aspect-[210/297] w-full object-contain"
            onerror={() => (failed = true)}
          />
        {:else}
          <iframe
            src={record.url}
            title="{record.deviceId} {record.title} PDF 원문"
            class="h-layout-panel-height w-full border-0"
            onerror={() => (failed = true)}
          ></iframe>
        {/if}
      </div>
    {/key}
  {/if}
</section>
