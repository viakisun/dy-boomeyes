<script lang="ts">
  // B4-02 프로토콜 관리 (specs/admin-protocol-rules AC-1 · AC-2 · AC-3) — D4 장면 8: YAML 업로드 → 오류 샘플 파싱 → 알림 발생 확인
  import { invalidateAll } from '$app/navigation';
  import { SCR, type Issue, type ParseResult, type ProtocolVersion } from '@boomeyes/domain';
  import {
    Badge,
    Banner,
    Button,
    DataTable,
    EmptyState,
    FileUpload,
    SEVERITY_LABEL,
    SEVERITY_TONE,
    StatusPill,
    Tabs,
    fmtDateTime,
    toast,
    type Column,
    Inspector,
    PageHeader,
  } from '@boomeyes/ui';
  import { untrack } from 'svelte';
  import { parse as parseYaml } from 'yaml';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const COLUMNS: Column[] = [
    { key: 'version', label: '버전' },
    { key: 'kind', label: '구분' },
    { key: 'fields', label: '필드 수', align: 'right' },
    { key: 'lastReceivedAt', label: '마지막 수신' },
    { key: 'uploaded', label: '등록' },
  ];
  const fieldCount = (v: ProtocolVersion) => v.def.groups.reduce((n, g) => n + g.fields.length, 0);
  let picked = $state<string | null>(null);
  const selectedId = $derived(
    picked && data.protocols.some((p) => p.id === picked)
      ? picked
      : (data.protocols.find((p) => p.kind === 'production')?.id ?? data.protocols[0]?.id ?? null),
  );
  const selected = $derived(data.protocols.find((p) => p.id === selectedId) ?? null);
  const me = () => session.user?.userId ?? 'ops01';

  // 업로드 (AC-2)
  let upload = $state<{ name: string; ok: boolean; errors: Issue[] } | null>(null);
  let busy = $state(false);
  async function onfile(f: { name: string; text: string }) {
    busy = true;
    try {
      let def: unknown;
      try {
        def = parseYaml(f.text);
      } catch (e) {
        upload = {
          name: f.name,
          ok: false,
          errors: [{ path: '', reason: `YAML 구문 오류 — ${(e as Error).message}` }],
        };
        return;
      }
      const r = await data.api.uploadProtocol(def, { filename: f.name, by: me() });
      upload = { name: f.name, ok: r.ok, errors: r.errors };
      if (r.ok && r.version) {
        picked = r.version.id;
        toast(`테스트 버전 등록 — ${r.version.version}`);
        await invalidateAll();
      }
    } catch (e) {
      toast(`업로드 실패 — ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }

  // 샘플 테스트 (AC-3)
  // 편집 사본 — 최초 1회만 데이터에서 초기화(untrack: 이후엔 pickSample이 갱신)
  let sampleId = $state(untrack(() => data.samples[0]?.id ?? ''));
  let sampleText = $state(untrack(() => data.samples[0]?.json ?? ''));
  let result = $state<ParseResult | { ok: false; errors: Issue[]; warnings: Issue[]; alerts: [] } | null>(null);
  const tabs = $derived(data.samples.map((s) => ({ id: s.id, label: s.label })));
  function pickSample(id: string) {
    sampleId = id;
    sampleText = data.samples.find((s) => s.id === id)?.json ?? '';
    result = null;
  }
  async function runTest() {
    if (!selected) return;
    let obj: unknown;
    try {
      obj = JSON.parse(sampleText);
    } catch (e) {
      result = {
        ok: false,
        errors: [{ path: '', reason: `JSON 구문 오류 — ${(e as Error).message}` }],
        warnings: [],
        alerts: [],
      };
      return;
    }
    try {
      result = await data.api.testSample(selected.id, obj);
    } catch (e) {
      toast(`샘플 테스트 실패 — ${(e as Error).message}`);
    }
  }
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B4-02']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader
      title="프로토콜 관리"
      description="운영 {data.protocols.filter((p) => p.kind === 'production').length} · 테스트 {data.protocols.filter(
        (p) => p.kind === 'test',
      ).length} — 정의 파일로 장비·데이터를 늘립니다"
      ref="FR-020"
    />

    <DataTable
      columns={COLUMNS}
      rows={data.protocols}
      rowKey={(p: ProtocolVersion) => p.id}
      selectedKey={selectedId}
      onselect={(p: ProtocolVersion) => (picked = p.id)}
      dense
      caption="프로토콜 버전"
    >
      {#snippet cell(p: ProtocolVersion, col: Column)}
        {#if col.key === 'version'}<span class="text-code-md">{p.version}</span>
        {:else if col.key === 'kind'}<StatusPill
            tone={p.kind === 'production' ? 'success' : 'progress'}
            label={p.kind === 'production' ? '운영' : '테스트'}
            size="sm"
          />
        {:else if col.key === 'fields'}{fieldCount(p)}
        {:else if col.key === 'lastReceivedAt'}<span class="tabular-nums"
            >{p.lastReceivedAt ? fmtDateTime(p.lastReceivedAt) : '—'}</span
          >
        {:else}<span class="tabular-nums">{fmtDateTime(p.uploadedAt)} · {p.uploadedBy}</span>{/if}
      {/snippet}
    </DataTable>

    <div class="gap-inline-lg grid lg:grid-cols-2">
      <section class="gap-stack-sm flex flex-col" aria-label="정의 업로드">
        <h2 class="text-heading-sm">정의 업로드 · 검증</h2>
        <FileUpload disabled={busy} {onfile} />
        {#if upload}
          {#if upload.ok}
            <Banner tone="success">{upload.name} — 검증 통과, 테스트 버전으로 등록했습니다</Banner>
          {:else}
            <Banner tone="danger">{upload.name} — 검증 실패 {upload.errors.length}건, 저장하지 않았습니다</Banner>
            <ul
              class="rounded-card border-border bg-surface divide-border-subtle divide-y border"
              aria-label="검증 오류"
            >
              {#each upload.errors as e, i (i)}
                <li class="px-inset-md py-inset-xs text-body-sm gap-inline-md flex">
                  <span class="text-code-sm text-danger-fg shrink-0">{e.path || '(root)'}</span><span>{e.reason}</span>
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </section>

      <section class="gap-stack-sm flex flex-col" aria-label="샘플 테스트">
        <h2 class="text-heading-sm">
          샘플 테스트 <span class="text-body-sm text-fg-muted">{selected?.version ?? ''}</span>
        </h2>
        <Tabs variant="pill" size="sm" {tabs} value={sampleId} onchange={pickSample} />
        <textarea
          class="rounded-control border-border bg-surface p-inset-sm text-code-sm min-h-layout-map-min w-full border"
          bind:value={sampleText}
          aria-label="샘플 JSON"
          spellcheck="false"></textarea>
        <div class="gap-inline-sm flex items-center">
          <Button size="sm" onclick={runTest} disabled={!selected}>샘플 테스트</Button>
          {#if result}
            <StatusPill
              tone={result.ok ? 'success' : 'danger'}
              label={result.ok
                ? `정상 파싱 · 알림 ${result.alerts.length}건`
                : `오류 ${result.errors.length}건 · 알림 ${result.alerts.length}건`}
              size="sm"
            />
          {/if}
        </div>
        {#if result}
          {#if result.errors.length}
            <ul
              class="rounded-card border-border bg-surface divide-border-subtle divide-y border"
              aria-label="파싱 오류"
            >
              {#each result.errors as e, i (i)}
                <li class="px-inset-md py-inset-xs text-body-sm gap-inline-md flex">
                  <span class="text-code-sm text-danger-fg shrink-0">{e.path || '(root)'}</span><span>{e.reason}</span>
                </li>
              {/each}
            </ul>
          {/if}
          {#if result.warnings.length}
            <p class="text-label-sm text-fg-muted">경고 {result.warnings.length}건 — 정의에 없는 필드는 무시됩니다</p>
          {/if}
          {#if result.alerts.length}
            <div class="gap-inline-xs flex flex-wrap" aria-label="발생 알림 미리보기">
              {#each result.alerts as a, i (i)}
                <Badge tone={SEVERITY_TONE[a.severity]} variant="subtle"
                  >{SEVERITY_LABEL[a.severity]} · {a.message}</Badge
                >
              {/each}
            </div>
          {:else}
            <p class="text-label-sm text-fg-muted">발생할 알림 없음</p>
          {/if}
        {/if}
      </section>
    </div>
  </div>

  <Inspector label="버전 상세">
    {#if selected}
      <div class="gap-stack-xs flex flex-col">
        <div class="flex items-center justify-between">
          <span class="text-code-md">{selected.version}</span>
          <StatusPill
            tone={selected.kind === 'production' ? 'success' : 'progress'}
            label={selected.kind === 'production' ? '운영' : '테스트'}
            size="sm"
          />
        </div>
        {#if selected.note}<p class="text-body-sm text-fg-muted">{selected.note}</p>{/if}
        <p class="text-label-sm text-fg-muted">그룹 {selected.def.groups.length} · 필드 {fieldCount(selected)}</p>
      </div>
      <ul class="gap-stack-sm flex flex-col" aria-label="필드 정의">
        {#each selected.def.groups as g (g.group)}
          <li class="gap-stack-xs flex flex-col">
            <span class="text-label-md text-fg">
              {g.group}
              <span class="text-fg-muted">· {g.key ?? '(root)'}{g.list ? '[]' : ''}{g.required ? '' : ' · 선택'}</span>
            </span>
            <div class="gap-inline-xs flex flex-wrap">
              {#each g.fields as f (f.name)}
                <Badge tone={f.required ? 'accent' : 'neutral'} variant="outline"
                  >{f.alias ?? f.name}:{f.type}{f.unit ? ` (${f.unit})` : ''}</Badge
                >
              {/each}
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <EmptyState title="버전을 선택하세요" />
    {/if}
  </Inspector>
</div>
