<script lang="ts">
  import {
    ownerHref,
    ownerDetailReturn,
    type OwnerAttachment,
    type OwnerDocument,
    type OwnerViewProps,
  } from '@boomeyes/domain';
  import { onDestroy, tick } from 'svelte';
  import Button from '../primitives/Button.svelte';
  import Dialog from '../primitives/Dialog.svelte';
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
  <header class="gap-stack-sm flex flex-col">
    <p class="text-label-md text-fg-muted">장비 기록</p>
    <h1 class="text-heading-xl">장비 서류</h1>
  </header>
  {#if data.devices.length === 0}
    <div class="border-border p-inset-xl rounded-card border">
      <h2 class="text-heading-sm">등록된 장비가 없습니다</h2>
      <p class="text-body-md text-fg-muted">장비가 등록되면 서류를 확인할 수 있습니다.</p>
    </div>
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
          class="min-h-size-touch-min"
          onclick={() => navigate(ownerDetailReturn(url, app, device.id))}>장비 상세로</Button
        >{/if}
    </div>
    {#if !device}
      <p class="text-body-md text-danger-fg" role="alert">
        이 장비의 서류에 접근할 수 없습니다. 장비를 다시 선택해 주세요.
      </p>
    {:else}
      <section
        class="border-border rounded-card bg-surface border"
        aria-labelledby="owner-document-list"
        data-device={device.id}
      >
        <div class="p-inset-lg gap-stack-sm border-border flex flex-wrap items-baseline justify-between border-b">
          <h2 id="owner-document-list" tabindex="-1" class="text-heading-md">
            {device.unit}호기 서류 <span class="text-fg-muted">{documents.length}건</span>
          </h2>
          <p class="text-body-sm text-fg-muted">{device.site}</p>
        </div>
        {#each documents as record (record.id)}
          <button
            class="{FOCUS} border-border hover:bg-ui-hover gap-stack-sm p-inset-lg flex w-full flex-wrap items-center justify-between border-b text-left last:border-b-0"
            class:bg-selected={selectedId === record.id}
            data-doc={record.id}
            aria-label="{record.title} 열기"
            aria-pressed={selectedId === record.id}
            onclick={() => openDocument(record.id)}
          >
            <span class="gap-stack-xs flex min-w-0 flex-col"
              ><span class="text-body-md font-semibold break-words">{record.title}</span><span
                class="text-body-sm text-fg-muted"
                >{record.issuedAt.slice(0, 10)} · {record.type === 'application/pdf'
                  ? 'PDF'
                  : '이미지'}{record.sessionOnly ? ' · 시연용 첨부' : ''}</span
              ></span
            >
            <span class="text-label-lg text-accent-fg">원문 보기 ↗</span>
          </button>
        {:else}<p class="text-body-md text-fg-muted p-inset-lg">이 호기에 등록된 서류가 없습니다.</p>{/each}
      </section>
      {#if loading}<div class="bg-surface-sunken rounded-card p-inset-xl text-body-md" aria-busy="true" role="status">
          원문을 불러오는 중입니다.
        </div>
      {:else if error}<div
          class="gap-stack-md p-inset-lg border-danger-border rounded-card flex flex-col items-start border"
          role="alert"
        >
          <p>{error}</p>
          <Button class="min-h-size-touch-min" onclick={() => revision++}>다시 불러오기</Button>
        </div>
      {:else if selected}<DocumentViewer document={selected} onclose={closeViewer} />{/if}
      <section
        class="border-border p-inset-lg gap-stack-md rounded-card flex flex-col border"
        aria-labelledby="owner-upload-title"
      >
        <h2 id="owner-upload-title" class="text-heading-sm">시연 파일 첨부</h2>
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
