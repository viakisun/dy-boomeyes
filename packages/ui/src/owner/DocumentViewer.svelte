<script lang="ts">
  import type { OwnerDocument } from '@boomeyes/domain';
  import FileText from '@lucide/svelte/icons/file-text';
  import Image from '@lucide/svelte/icons/image';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Button from '../primitives/Button.svelte';
  import Badge from '../primitives/Badge.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import { OWNER_DOC_TYPE_LABEL } from '../lib/labels';
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
  class="bg-surface rounded-card shadow-raised min-w-0 overflow-hidden"
  data-document-viewer
  data-doc={record.id}
  aria-label="{record.deviceId} {record.title} 원문"
>
  <div class="border-border-subtle gap-inline-md p-inset-md flex flex-wrap items-center justify-between border-b">
    <div class="gap-inline-md flex min-w-0 items-center">
      <IconTile
        >{#if record.type === 'application/pdf'}<FileText class="size-size-icon-lg" />{:else}<Image
            class="size-size-icon-lg"
          />{/if}</IconTile
      >
      <div class="gap-stack-xs flex min-w-0 flex-col">
        <h2 class="text-heading-sm break-words">{record.title}</h2>
        <span class="gap-inline-sm flex flex-wrap items-center">
          <Badge variant="outline">{OWNER_DOC_TYPE_LABEL[record.type]}</Badge>
          {#if record.sessionOnly}<Badge variant="outline">첨부 미리보기</Badge>{/if}
          <span class="text-code-sm text-fg-muted">{record.deviceId}</span>
        </span>
      </div>
    </div>
    <div class="gap-inline-sm flex flex-wrap">
      <!-- 원문이 없는 서류는 목록·만료만 있고 파일이 없다 — 열 수 없는 버튼을 보이지 않는다 -->
      {#if record.url}
        <Button variant="outline" tone="neutral" href={record.url} target="_blank" rel="noopener noreferrer"
          >원문 새 창 열기 <ExternalLink class="size-size-icon-sm" aria-hidden="true" /></Button
        >
      {:else}
        <p class="text-body-sm text-fg-muted">원문이 등록되지 않았습니다. 발급일과 만료일만 확인할 수 있습니다.</p>
      {/if}
      {#if onclose}<Button variant="ghost" tone="neutral" onclick={onclose}>서류 목록으로</Button>{/if}
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
