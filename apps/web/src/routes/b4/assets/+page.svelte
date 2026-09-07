<script lang="ts">
  // B4-03 장비·현장·프로파일 — 탭 3(장비 · 현장 · 프로파일) · 현장 등록/편집(현장명·주소·기간·담당 안전관리자) · 호기(1~120) 등록/배정(중복 오류) · 프리셋 전환 → 카메라 월 미리보기가 즉시 따른다(B1-02·A1-04와 같은 visibleIn) · 8축 표시만(축 편집 W4 · FR-029) (specs/sites-assets-leases AC-1 · DISC-028)
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, profileFlags, type Device, type Site, type VideoProfile } from '@boomeyes/domain';
  import {
    Badge,
    Button,
    DataTable,
    EQUIPMENT_LABEL,
    EQUIPMENT_TONE,
    EmptyState,
    Figure,
    Inspector,
    KeyValueList,
    PageHeader,
    Select,
    SiteProfileForm,
    StatusPill,
    Tabs,
    TextField,
    fmtDateTime,
    toast,
    type Column,
  } from '@boomeyes/ui';
  import { CameraWall, MOUNT_LABEL, STILL } from '@boomeyes/video';
  let { data } = $props();
  const TABS = [
    { id: 'devices', label: '장비' },
    { id: 'sites', label: '현장' },
    { id: 'profiles', label: '프로파일' },
  ];
  const go = (q: string) =>
    goto(resolve(`/b4/assets?${q}` as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  const siteName = (id: string) => data.sites.find((s) => s.id === id)?.name ?? id;
  const siteOptions = $derived(data.sites.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` })));
  const safetyOptions = $derived(
    data.users.filter((u) => u.role === 'site-safety').map((u) => ({ value: u.id, label: `${u.display} (${u.id})` })),
  );
  let busy = $state(false);
  async function run(label: string, fn: () => Promise<unknown>) {
    busy = true;
    try {
      await fn();
      await invalidateAll();
      toast(label);
    } catch (e) {
      toast(`${label} 실패 — ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }

  // 장비 탭 — 선택 장비 · 배정 현장 · 호기 등록
  let pickedDevice = $state<string | null>(null);
  const device = $derived(data.devices.find((d) => d.id === pickedDevice) ?? data.devices[0] ?? null);
  let assignTo = $state('');
  let newUnit = $state('');
  let newSite = $state('');
  const DEVICE_COLS: Column[] = [
    { key: 'id', label: '호기', nowrap: true },
    { key: 'site', label: '현장', nowrap: true },
    { key: 'state', label: '상태', kind: 'status' },
    { key: 'owner', label: '소유주', nowrap: true },
    { key: 'at', label: '마지막 수신', kind: 'date' },
  ];

  // 현장 탭 — 편집 사본은 선택 현장이 바뀔 때(저장 뒤 다시 읽기 포함) 다시 채운다
  let pickedSite = $state<string | null>(null);
  const site = $derived(data.sites.find((s) => s.id === (pickedSite ?? data.site)) ?? data.sites[0] ?? null);
  let form = $state({ name: '', address: '', company: '', safetyUserId: '', from: '', to: '' });
  $effect(() => {
    if (site)
      form = {
        name: site.name,
        address: site.address,
        company: site.company,
        safetyUserId: site.safetyUserId,
        from: site.period?.from ?? '',
        to: site.period?.to ?? '',
      };
  });
  const dirty = $derived(
    !!site &&
      (form.name !== site.name ||
        form.address !== site.address ||
        form.company !== site.company ||
        form.safetyUserId !== site.safetyUserId ||
        form.from !== (site.period?.from ?? '') ||
        form.to !== (site.period?.to ?? '')),
  );
  let create = $state({ name: '', address: '', company: 'G/S 건설', safetyUserId: '', from: '', to: '' });
  const period = (f: { from: string; to: string }) => (f.from && f.to ? { from: f.from, to: f.to } : undefined);
  const SITE_COLS: Column[] = [
    { key: 'id', label: '현장', nowrap: true },
    { key: 'company', label: '건설사', nowrap: true },
    { key: 'period', label: '기간', kind: 'date' },
    { key: 'safety', label: '안전관리자', nowrap: true },
    { key: 'profile', label: '프로파일', kind: 'status' },
    { key: 'devices', label: '장비', kind: 'num' },
  ];
  const devicesOf = (siteId: string) => data.devices.filter((d) => d.siteId === siteId);

  // 프로파일 탭 — 현장 선택 · 프리셋(SiteProfileForm) · 카메라 월 미리보기(visibleIn = B1-02 · A1-04와 같은 규칙)
  let profileSiteId = $state('');
  const profileSite = $derived(data.sites.find((s) => s.id === (profileSiteId || data.site)) ?? data.sites[0] ?? null);
  let preset = $state<VideoProfile>('P-SD');
  $effect(() => {
    if (profileSite) preset = profileSite.videoProfile;
  });
  const profileDevices = $derived(profileSite ? devicesOf(profileSite.id) : []);
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B4-03']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader
      title="장비·현장·프로파일"
      description="현장 · 호기 · 프로파일 프리셋을 등록하고 배정합니다"
      ref="DISC-028 FR-029 FR-031"
    >
      <Tabs tabs={TABS} value={data.tab} onchange={(id) => go(`tab=${id}`)} />
    </PageHeader>

    {#if data.tab === 'devices'}
      <DataTable
        columns={DEVICE_COLS}
        rows={data.devices}
        rowKey={(d: Device) => d.id}
        selectedKey={device?.id ?? null}
        onselect={(row: Device) => (pickedDevice = row.id)}
        caption="호기 목록"
      >
        {#snippet cell(row: Device, col: Column)}
          {@const key = col.key}
          {#if key === 'id'}<span class="text-code-md">{row.id}</span> · {row.unitNo}호기
          {:else if key === 'site'}{siteName(row.siteId)}
          {:else if key === 'state'}<StatusPill
              tone={EQUIPMENT_TONE[row.state]}
              label={EQUIPMENT_LABEL[row.state]}
              size="sm"
            />
          {:else if key === 'owner'}{row.ownerId}
          {:else if key === 'at'}{fmtDateTime(row.telemetry.at)}
          {/if}
        {/snippet}
      </DataTable>
      <form
        class="gap-stack-md rounded-card border-border bg-surface p-inset-lg max-w-layout-form-max flex flex-col border"
        aria-label="호기 등록"
        onsubmit={(e) => {
          e.preventDefault();
          const unitNo = Number(newUnit);
          run(`등록 — CPB-${String(unitNo).padStart(3, '0')} ${unitNo}호기`, async () => {
            await data.api.registerDevice({ unitNo, siteId: newSite });
            newUnit = '';
          });
        }}
      >
        <h2 class="text-heading-sm">호기 등록</h2>
        <TextField label="호기(1~120)" type="number" min="1" max="120" bind:value={newUnit} required />
        <Select label="현장" bind:value={newSite} options={siteOptions} placeholder="선택" required />
        <div class="flex justify-end"><Button type="submit" disabled={busy}>등록</Button></div>
      </form>
    {:else if data.tab === 'sites'}
      <DataTable
        columns={SITE_COLS}
        rows={data.sites}
        rowKey={(s: Site) => s.id}
        selectedKey={site?.id ?? null}
        onselect={(row: Site) => ((pickedSite = row.id), go(`tab=sites&site=${row.id}`))}
        caption="현장 목록"
      >
        {#snippet cell(row: Site, col: Column)}
          {@const key = col.key}
          {#if key === 'id'}<span class="text-body-md">{row.name}</span>
            <span class="text-label-sm text-fg-muted">{row.id}</span>
          {:else if key === 'company'}{row.company}
          {:else if key === 'period'}{row.period ? `${row.period.from} ~ ${row.period.to}` : '—'}
          {:else if key === 'safety'}{data.users.find((u) => u.id === row.safetyUserId)?.display ?? row.safetyUserId}
          {:else if key === 'profile'}<Badge tone="neutral" variant="outline">{row.videoProfile}</Badge>
          {:else if key === 'devices'}{devicesOf(row.id).length}
          {/if}
        {/snippet}
      </DataTable>
      <form
        class="gap-stack-md rounded-card border-border bg-surface p-inset-lg max-w-layout-form-max flex flex-col border"
        aria-label="현장 등록"
        onsubmit={(e) => {
          e.preventDefault();
          run(`등록 — ${create.name}`, async () => {
            await data.api.createSite({
              name: create.name,
              address: create.address,
              company: create.company,
              safetyUserId: create.safetyUserId,
              period: period(create),
            });
            create = { name: '', address: '', company: 'G/S 건설', safetyUserId: '', from: '', to: '' };
          });
        }}
      >
        <h2 class="text-heading-sm">현장 등록</h2>
        <TextField label="현장명" bind:value={create.name} placeholder="예: 세종 C 아파트" required />
        <TextField label="주소" bind:value={create.address} required />
        <TextField label="건설사" bind:value={create.company} required />
        <Select
          label="담당 안전관리자"
          bind:value={create.safetyUserId}
          options={safetyOptions}
          placeholder="선택"
          required
        />
        <div class="gap-inline-md grid grid-cols-2">
          <TextField label="기간 시작" type="date" bind:value={create.from} />
          <TextField label="기간 종료" type="date" bind:value={create.to} />
        </div>
        <div class="flex justify-end"><Button type="submit" disabled={busy}>등록</Button></div>
      </form>
    {:else if profileSite}
      <div class="gap-stack-md flex flex-col">
        <Select
          label="현장"
          value={profileSite.id}
          options={siteOptions}
          onchange={(e) => ((profileSiteId = e.currentTarget.value), go(`tab=profiles&site=${e.currentTarget.value}`))}
        />
        <SiteProfileForm
          site={profileSite}
          bind:preset
          {busy}
          onapply={(p) =>
            run(`프로파일 — ${profileSite?.name} ${p}`, () => data.api.setSiteProfile(profileSite!.id, p))}
        />
        <Figure
          src={STILL.front}
          alt="설치 구성도 — 붐 위 카메라 2대의 시야: 일반 카메라는 본체·1번 관절 인근, AI 카메라는 마지막 강체·경사 시야"
          caption="설치 구성도 · 일반 카메라 {MOUNT_LABEL['body-joint1']} · AI 카메라 {MOUNT_LABEL['last-rigid']}"
          ref="DISC-040 DISC-004"
        />
        <CameraWall
          cameras={data.cameras.filter((c) => profileDevices.some((d) => d.id === c.deviceId))}
          devices={profileDevices}
          sites={data.sites}
          title="카메라 월 미리보기 — {profileSite.name}"
        />
      </div>
    {:else}
      <EmptyState title="현장이 없습니다" description="현장 탭에서 먼저 등록하세요." />
    {/if}
  </div>

  {#if data.tab === 'devices'}
    {#snippet assignRow()}
      {#if device}
        <Button
          variant="outline"
          tone="neutral"
          disabled={busy || !assignTo || assignTo === device.siteId}
          onclick={() =>
            run(`배정 — ${device.id} → ${siteName(assignTo)}`, () => data.api.assignDevice(device.id, assignTo))}
          >배정</Button
        >
      {/if}
    {/snippet}
    <Inspector label="장비 상세" footer={device ? assignRow : undefined}>
      {#if device}
        <h2 class="text-heading-sm">{device.id} · {device.unitNo}호기</h2>
        <KeyValueList
          items={[
            { label: '현장', value: siteName(device.siteId) },
            { label: '상태', value: EQUIPMENT_LABEL[device.state] },
            { label: '소유주', value: device.ownerId },
            { label: '위치', value: `${device.lat.toFixed(4)}, ${device.lng.toFixed(4)}` },
            { label: '마지막 수신', value: fmtDateTime(device.telemetry.at) },
          ]}
        />
        <Select label="배정 현장" bind:value={assignTo} options={siteOptions} placeholder="현장 선택" />
      {:else}
        <EmptyState title="호기를 선택하세요" />
      {/if}
    </Inspector>
  {:else if data.tab === 'sites'}
    <Inspector label="현장 편집">
      {#if site}
        <h2 class="text-heading-sm">{site.name}</h2>
        <span class="text-label-sm text-fg-muted"
          >{site.id} · 장비 {devicesOf(site.id).length}대 · {site.videoProfile}</span
        >
        <form
          class="gap-stack-sm flex flex-col"
          aria-label="현장 편집"
          onsubmit={(e) => {
            e.preventDefault();
            run(`저장 — ${form.name}`, () =>
              data.api.updateSite(site.id, {
                name: form.name,
                address: form.address,
                company: form.company,
                safetyUserId: form.safetyUserId,
                period: period(form),
              }),
            );
          }}
        >
          <TextField label="현장명" bind:value={form.name} required />
          <TextField label="주소" bind:value={form.address} required />
          <TextField label="건설사" bind:value={form.company} required />
          <Select label="담당 안전관리자" bind:value={form.safetyUserId} options={safetyOptions} />
          <TextField label="기간 시작" type="date" bind:value={form.from} />
          <TextField label="기간 종료" type="date" bind:value={form.to} />
          <div class="flex justify-end"><Button type="submit" disabled={busy || !dirty}>저장</Button></div>
        </form>
      {:else}
        <EmptyState title="현장을 선택하세요" />
      {/if}
    </Inspector>
  {:else}
    <Inspector label="프로파일 요약">
      {#if profileSite}
        {@const flags = profileFlags(profileSite.videoProfile)}
        <h2 class="text-heading-sm">{profileSite.name}</h2>
        <KeyValueList
          items={[
            { label: '적용 프리셋', value: flags.profile },
            { label: '채널(AX-1)', value: `${flags.channels}채널` },
            { label: '저장(AX-4)', value: flags.sources.join(' · ') },
            { label: '이벤트·라이브', value: `${flags.eventRoute} · ${flags.liveRoute}` },
            { label: '바디캠(AX-6)', value: flags.bodycam ?? '없음' },
            { label: '장비', value: `${profileDevices.length}대` },
            { label: '장착 위치', value: `일반 ${MOUNT_LABEL['body-joint1']} · AI ${MOUNT_LABEL['last-rigid']}` },
          ]}
        />
        <p class="text-body-sm text-fg-muted">
          적용하면 같은 데이터를 읽는 관제 대시보드(B1-02) 카메라 월과 현장 모니터(A1-04) 타일의 채널 수가 즉시 이
          프리셋을 따른다.
        </p>
      {/if}
    </Inspector>
  {/if}
</div>
