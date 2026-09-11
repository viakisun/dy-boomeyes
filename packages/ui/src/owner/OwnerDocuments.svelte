<script lang="ts">
  import {
    ownerHref,
    ownerDetailReturn,
    type OwnerAttachment,
    type OwnerDocument,
    type OwnerViewProps,
  } from '@boomeyes/domain';
  import { onDestroy, tick } from 'svelte';
  import FileText from '@lucide/svelte/icons/file-text';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import Calendar from '@lucide/svelte/icons/calendar';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Button from '../primitives/Button.svelte';
  import Badge from '../primitives/Badge.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import PageHeader from '../primitives/PageHeader.svelte';
  import Skeleton from '../primitives/Skeleton.svelte';
  import Dialog from '../primitives/Dialog.svelte';
  import { OWNER_DOC_TYPE_LABEL } from '../lib/labels';
  import { dueLabel } from '../lib/format';
  import DocumentViewer from './DocumentViewer.svelte';
  import { connectivity } from '../lib/connectivity.svelte';
  import { FOCUS } from '../lib/cx';
  import { toast } from '../primitives/toast-store.svelte';
  import { prepareOwnerAttachment, releaseOwnerAttachment } from './owner-files';
  let { data, api, app, url, navigate, refresh, capture = false }: OwnerViewProps = $props();
  const deviceId = $derived(url.searchParams.get('device') ?? data.devices[0]?.id);
  const device = $derived(data.devices.find((item) => item.id === deviceId));
  const documents = $derived(data.documents.filter((item) => item.deviceId === deviceId));
  const requested = $derived(url.searchParams.get('doc'));
  const selectedId = $derived(requested === 'list' ? undefined : (requested ?? documents[0]?.id));
  let selected = $state<OwnerDocument | null>(null);
  let loading = $state(false);
  let error = $state('');
  let revision = $state(0);
  let pending = $state<OwnerAttachment | null>(null);
  let preparing = $state(false);
  let saving = $state(false);
  let uploadError = $state('');
  let dialogOpen = $state(false);
  let input = $state<HTMLInputElement>();
  let generation = 0;
  let parser: AbortController | undefined;
  const pendingDocument = $derived<OwnerDocument | null>(
    pending && device
      ? {
          id: 'attachment-preview',
          deviceId: device.id,
          title: pending.name,
          filename: pending.name,
          kind: '시연용 첨부',
          type: pending.type,
          url: pending.url,
          previewUrl: pending.previewUrl,
          issuedAt: data.at,
          expiresAt: null,
          sessionOnly: true,
        }
      : null,
  );
  $effect(() => {
    const id = selectedId;
    const expectedDevice = deviceId;
    void revision;
    selected = null;
    error = '';
    if (!id || !device) {
      loading = false;
      return;
    }
    let active = true;
    loading = true;
    api
      .document(id)
      .then((result) => {
        if (!active) return;
        if (result.deviceId !== expectedDevice) throw new Error('서류와 선택한 장비가 다릅니다.');
        selected = result;
      })
      .catch(() => {
        if (active) error = '선택한 장비의 서류를 찾을 수 없습니다.';
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });
  function changeDevice(value: string) {
    cancel();
    navigate(ownerHref(url, 'documents', app, { device: value, return: ownerDetailReturn(url, app, value) }));
  }
  function openDocument(id: string) {
    navigate(
      ownerHref(url, 'documents', app, { device: deviceId ?? null, doc: id, return: url.searchParams.get('return') }),
    );
  }
  async function choose(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    const key = ++generation;
    parser?.abort();
    parser = new AbortController();
    releaseOwnerAttachment($state.snapshot(pending));
    pending = null;
    uploadError = '';
    if (!connectivity.online) {
      uploadError = '오프라인에서는 첨부할 수 없습니다. 연결 후 다시 선택해 주세요.';
      return;
    }
    preparing = true;
    try {
      const result = await prepareOwnerAttachment(file, parser.signal);
      if (key !== generation) {
        releaseOwnerAttachment(result);
        return;
      }
      pending = result;
      dialogOpen = true;
    } catch (cause) {
      if (key === generation) uploadError = cause instanceof Error ? cause.message : '파일을 읽지 못했습니다.';
    } finally {
      if (key === generation) preparing = false;
      if (input) input.value = '';
    }
  }
  function cancel() {
    if (saving) return;
    generation++;
    parser?.abort();
    releaseOwnerAttachment($state.snapshot(pending));
    pending = null;
    dialogOpen = false;
    preparing = false;
    if (input) input.value = '';
    void tick().then(() => input?.focus());
  }
  async function confirm() {
    if (!pending || !device || saving) return;
    if (!connectivity.online) {
      uploadError = '연결이 끊겼습니다. 다시 연결한 후 첨부를 확정해 주세요.';
      return;
    }
    saving = true;
    uploadError = '';
    try {
      const attached = await api.attach(device.id, $state.snapshot(pending));
      pending = null; // URL ownership moves to the browser session API.
      dialogOpen = false;
      await refresh();
      openDocument(attached.id);
      toast('시연 파일을 첨부했습니다.');
    } catch (cause) {
      uploadError = cause instanceof Error ? cause.message : '첨부하지 못했습니다. 다시 시도해 주세요.';
    } finally {
      saving = false;
    }
  }
  async function closeViewer() {
    openDocument('list');
    await tick();
    document.getElementById('owner-document-list')?.focus();
  }
  onDestroy(() => {
    generation++;
    parser?.abort();
    releaseOwnerAttachment($state.snapshot(pending));
  });
</script>

<div class="gap-stack-xl flex min-w-0 flex-col">
  <PageHeader title="장비 서류" />
  {#if data.devices.length === 0}
    <EmptyState title="등록된 장비 없음" />
  {:else}
    <div class="gap-stack-md flex flex-wrap items-end justify-between">
      <div class="gap-stack-xs flex min-w-0 flex-1 flex-col">
        <label class="text-label-lg" for="owner-document-device">장비 선택</label>
        <select
          id="owner-document-device"
          value={deviceId}
          onchange={(event) => changeDevice(event.currentTarget.value)}
          class="{FOCUS} border-border bg-surface text-body-md px-inset-md rounded-control min-h-size-touch-min py-inset-sm min-w-0 border"
        >
          {#each data.devices as item (item.id)}<option value={item.id}>{item.unit}호기 · {item.site}</option>{/each}
        </select>
      </div>
      {#if device}<Button
          variant="outline"
          tone="neutral"
          onclick={() => navigate(ownerDetailReturn(url, app, device.id))}>장비 상세로</Button
        >{/if}
    </div>
    {#if !device}
      <p class="text-body-md text-danger-fg" role="alert">
        이 장비의 서류에 접근할 수 없습니다. 장비를 다시 선택해 주세요.
      </p>
    {:else}
      <section
        class="rounded-card bg-surface shadow-raised overflow-hidden"
        aria-labelledby="owner-document-list"
        data-device={device.id}
      >
        <div class="px-inset-md py-inset-sm gap-inline-md flex flex-wrap items-baseline justify-between">
          <h2 id="owner-document-list" tabindex="-1" class="gap-inline-sm text-heading-sm flex items-center">
            {device.unit}호기 서류 <Badge count={documents.length} />
          </h2>
          <span class="text-body-sm text-fg-muted">{device.site}</span>
        </div>
        <ul class="divide-border-subtle divide-y" aria-label="{device.unit}호기 서류 목록">
          {#each documents as record (record.id)}
            {@const due = record.expiresAt ? dueLabel(record.expiresAt, new Date(data.at)) : null}
            <li>
              <button
                class="{FOCUS} hover:bg-ui-hover gap-inline-md px-inset-md py-inset-sm flex w-full min-w-0 items-center text-left"
                class:bg-selected={selectedId === record.id}
                data-doc={record.id}
                aria-label="{record.title} 열기"
                aria-pressed={selectedId === record.id}
                onclick={() => openDocument(record.id)}
              >
                {#if record.previewUrl || record.type !== 'application/pdf'}
                  <img
                    src={record.previewUrl ?? record.url}
                    alt=""
                    loading="lazy"
                    class="border-border-subtle rounded-mark bg-surface-sunken h-size-avatar-lg aspect-[210/297] shrink-0 border object-cover object-top"
                  />
                {:else}
                  <IconTile
                    >{#if record.sessionOnly}<Paperclip class="size-size-icon-lg" />{:else}<FileText
                        class="size-size-icon-lg"
                      />{/if}</IconTile
                  >
                {/if}
                <span class="gap-stack-xs flex min-w-0 flex-1 flex-col">
                  <span class="text-body-md font-semibold break-words">{record.title}</span>
                  <span class="gap-inline-sm text-body-sm text-fg-muted flex items-center"
                    ><Calendar class="size-size-icon-sm shrink-0" aria-hidden="true" /><span
                      >{record.issuedAt.slice(0, 10)}</span
                    >{#if due}<span class={due.overdue ? 'text-danger-fg font-medium' : 'text-fg-muted'}
                        >유효 {due.label}</span
                      >{/if}</span
                  >
                </span>
                <span class="gap-inline-sm flex shrink-0 flex-wrap items-center justify-end">
                  {#if record.sessionOnly}<Badge variant="outline">시연용 첨부</Badge>{/if}
                  <Badge variant="outline">{OWNER_DOC_TYPE_LABEL[record.type]}</Badge>
                  <span class="text-label-md text-accent-fg gap-inline-xs inline-flex items-center"
                    >원문 <ExternalLink class="size-size-icon-sm" aria-hidden="true" /></span
                  >
                </span>
              </button>
            </li>
          {:else}
            <li class="p-inset-md">
              <EmptyState title="등록된 서류 없음">
                {#snippet icon()}<IconTile><FileText class="size-size-icon-lg" /></IconTile>{/snippet}
              </EmptyState>
            </li>
          {/each}
        </ul>
      </section>
      {#if loading}<div
          class="rounded-card bg-surface shadow-raised p-inset-md gap-stack-sm flex flex-col"
          aria-busy="true"
          role="status"
        >
          <Skeleton class="w-layout-field-short" /><Skeleton shape="rect" class="h-layout-panel-height" /><span
            class="sr-only">원문을 불러오는 중입니다.</span
          >
        </div>
      {:else if error}<EmptyState title={error} tone="danger">
          {#snippet action()}<Button onclick={() => revision++}>다시 불러오기</Button>{/snippet}
        </EmptyState>
      {:else if selected}<DocumentViewer document={selected} onclose={closeViewer} />{/if}
      <section
        class="bg-surface-sunken p-inset-md gap-stack-sm rounded-card flex flex-col"
        aria-labelledby="owner-upload-title"
      >
        <h2 id="owner-upload-title" class="gap-inline-sm text-heading-sm flex items-center">
          <Paperclip class="size-size-icon-md text-fg-muted" aria-hidden="true" />시연 파일 첨부
        </h2>
        <p class="text-body-sm text-fg-muted">PDF · PNG · JPEG · 최대 10 MB</p>
        <label for="owner-upload" class="text-label-lg">시연 파일 선택</label>
        <input
          id="owner-upload"
          bind:this={input}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onchange={choose}
          disabled={preparing || saving || !connectivity.online}
          aria-label="시연 파일 선택"
          class="{FOCUS} text-body-md file:mr-inline-md file:rounded-control file:border-border-strong file:bg-surface file:px-inset-md file:text-fg min-h-[max(var(--sys-size-touch-min),var(--sys-size-control-md))] w-full min-w-0 file:min-h-[max(var(--sys-size-touch-min),var(--sys-size-control-md))] file:border"
        />
        {#if !connectivity.online}<p class="text-body-md text-warning-fg" role="status">
            오프라인에서는 첨부할 수 없습니다. 연결 후 다시 선택해 주세요.
          </p>{/if}
        {#if preparing}<p role="status" class="text-body-md">파일 내용을 확인하는 중입니다.</p>{/if}
        {#if uploadError && !dialogOpen}<p role="alert" class="text-body-md text-danger-fg">{uploadError}</p>{/if}
      </section>
    {/if}
  {/if}
</div>

<Dialog bind:open={dialogOpen} title="첨부 미리보기" size="lg" {capture} onclose={cancel}>
  {#if pendingDocument && device}
    <p class="text-body-md">{device.unit}호기에 첨부할 파일을 확인해 주세요.</p>
    <DocumentViewer document={pendingDocument} compact />
  {/if}
  {#if uploadError}<p role="alert" class="text-body-md text-danger-fg">{uploadError}</p>{/if}
  {#snippet footer()}
    <Button variant="ghost" tone="neutral" class="min-h-size-touch-min" disabled={saving} onclick={cancel}>취소</Button>
    <Button class="min-h-size-touch-min" loading={saving} disabled={!pending || !connectivity.online} onclick={confirm}
      >첨부 확정</Button
    >
  {/snippet}
</Dialog>
