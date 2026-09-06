<script lang="ts">
  // A1-07 메뉴·현장 정보 — 현장 기본정보(현장명·주소·기간·프로파일·담당) · 장비 요약 · 내 신청 · "현장 개설 신청" 시트 → createRequest(submitted → review) → B1-03 수신함 · 앱 정보 (specs/sites-assets-leases AC-5 · FR-017 · DISC-034)
  import { version } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import { ROLE_NAME, SCR, profileFlags, type Request } from '@boomeyes/domain';
  import {
    Badge,
    BottomSheet,
    Button,
    EmptyState,
    KeyValueList,
    REQUEST_KIND_LABEL,
    REQUEST_STATE_LABEL,
    REQUEST_TONE,
    Select,
    StatusPill,
    TextField,
    fmtDateTime,
    toast,
  } from '@boomeyes/ui';
  let { data } = $props();
  const abnormal = $derived(data.devices.filter((d) => d.state !== 'normal').length);
  const safety = $derived(
    data.users.find((u) => u.id === data.site?.safetyUserId)?.display ?? data.site?.safetyUserId ?? '—',
  );
  const flags = $derived(data.site ? profileFlags(data.site.videoProfile) : null);
  // 신청 시트 — 픽스처 apply면 열린 채로 시작(캡처), 실사용은 버튼으로
  let open = $state(data.apply);
  let kind = $state<Request['kind']>('site-open');
  let name = $state('');
  let count = $state('2');
  let address = $state('');
  let from = $state('');
  let to = $state('');
  let memo = $state('');
  let busy = $state(false);
  const KINDS = [
    { value: 'site-open', label: REQUEST_KIND_LABEL['site-open'] },
    { value: 'device-assign', label: REQUEST_KIND_LABEL['device-assign'] },
  ];
  async function submit() {
    if (!data.site || !data.me) return;
    const title = kind === 'site-open' ? `${name.trim()} 개설 신청` : `CPB ${count}대 배정 요청 — ${data.site.name}`;
    if (kind === 'site-open' && !name.trim()) {
      toast('현장명을 입력하세요');
      return;
    }
    busy = true;
    try {
      const note = [address.trim(), from && to ? `${from}~${to}` : '', memo.trim()].filter(Boolean).join(' · ');
      const r = await data.api.createRequest({
        kind,
        title,
        siteId: data.site.id,
        requesterId: data.me.id,
        ...(note ? { note } : {}),
      });
      await invalidateAll();
      toast(`신청 — ${r.id} ${REQUEST_STATE_LABEL[r.state]} (수신함 등록)`);
      open = false;
      name = '';
      address = '';
      from = '';
      to = '';
      memo = '';
    } catch (e) {
      toast(`신청 실패 — ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }
</script>

<div class="gap-stack-lg pb-layout-bottomnav-height flex flex-col" data-scr={SCR['A1-07']}>
  {#if data.site}
    <section class="gap-stack-sm flex flex-col" aria-label="현장 기본정보">
      <div class="flex items-center justify-between">
        <h2 class="text-heading-md">{data.site.name}</h2>
        <Badge tone="neutral" variant="outline">프로파일 {data.site.videoProfile}</Badge>
      </div>
      <KeyValueList
        label="현장 기본정보"
        items={[
          { label: '현장', value: `${data.site.id} · ${data.site.company}` },
          { label: '주소', value: data.site.address },
          { label: '기간', value: data.site.period ? `${data.site.period.from} ~ ${data.site.period.to}` : '미정' },
          { label: '담당 안전관리자', value: safety },
          { label: '영상 채널', value: flags ? `${flags.channels}채널 · 저장 ${flags.sources.join('·')}` : '—' },
          { label: '장비', value: `${data.devices.length}대 · 이상 ${abnormal}` },
          { label: '타설 일정', value: '입력 주체 미확정 (DISC-034)', muted: true },
        ]}
      />
    </section>
    <section class="gap-stack-sm flex flex-col" aria-label="신청">
      <div class="flex items-center justify-between">
        <h2 class="text-heading-md">내 신청 {data.requests.length}</h2>
        <Button size="sm" onclick={() => (open = true)}>현장 개설 신청</Button>
      </div>
      {#if data.requests.length}
        <ul class="gap-stack-xs flex flex-col" aria-label="내 신청">
          {#each data.requests as r (r.id)}
            <li
              class="rounded-card border-border bg-surface p-inset-md gap-stack-xs flex flex-col border"
              data-request={r.id}
            >
              <div class="flex items-center justify-between">
                <span class="text-label-md text-fg-muted">{r.id} · {REQUEST_KIND_LABEL[r.kind]}</span>
                <StatusPill tone={REQUEST_TONE[r.state]} label={REQUEST_STATE_LABEL[r.state]} size="sm" />
              </div>
              <span class="text-body-md">{r.title}</span>
              <span class="text-label-sm text-fg-muted"
                >{fmtDateTime(r.requestedAt)}{#if r.note}
                  · {r.note}{/if}</span
              >
            </li>
          {/each}
        </ul>
      {:else}
        <EmptyState
          title="신청이 없습니다"
          description="현장 개설·장비 배정 신청은 운영사 수신함(B1-03)에서 검토됩니다."
        />
      {/if}
    </section>
  {:else}
    <EmptyState title="연결된 현장이 없습니다" />
  {/if}
  <section class="gap-stack-sm flex flex-col" aria-label="앱 정보">
    <h2 class="text-heading-md">앱 정보</h2>
    <KeyValueList
      items={[
        { label: '계정', value: data.me ? `${data.me.display} (${data.me.id})` : '—' },
        { label: '역할', value: data.me ? ROLE_NAME[data.me.role] : '—' },
        { label: '앱', value: `BoomEyes 현장 앱 v${version}` },
      ]}
    />
  </section>

  <BottomSheet bind:open title="현장 개설 신청" capture onclose={() => (open = false)}>
    <div class="gap-stack-sm flex flex-col">
      <p class="text-body-sm text-fg-muted">
        신청은 운영사 수신함(B1-03)에 검토 중으로 등록됩니다 — 현장 개설(현장명·주소·기간) · 장비 배정(필요 대수·기간)
      </p>
      <Select label="신청 종류" bind:value={kind} options={KINDS} />
      {#if kind === 'site-open'}
        <TextField label="현장명" bind:value={name} placeholder="예: 한빛 초등학교 2공구" required />
        <TextField label="주소" bind:value={address} placeholder="예: 전주시 덕진구" />
      {:else}
        <TextField label="필요 대수" type="number" min="1" max="120" bind:value={count} />
      {/if}
      <div class="gap-inline-md grid grid-cols-2">
        <TextField label="기간 시작" type="date" bind:value={from} />
        <TextField label="기간 종료" type="date" bind:value={to} />
      </div>
      <TextField label="메모" bind:value={memo} placeholder="예: 10월 타설 시작, CPB 2대 필요" />
    </div>
    {#snippet footer()}
      <Button size="lg" block disabled={busy} onclick={submit}>제출</Button>
      <Button size="lg" block variant="ghost" tone="neutral" onclick={() => (open = false)}>닫기</Button>
    {/snippet}
  </BottomSheet>
</div>
