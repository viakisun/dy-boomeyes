<script lang="ts">
  // B4-04 사용자·권한 — 역할 · 현장 범위 · 상태 표 · 변경 즉시 저장 · 접근 화면은 가드와 같은 canAccess로 계산(역할 변경 즉시 반영, 내 계정이면 세션도 갱신) · 운영사는 안전관리자 권한 부여 불가(entities.rules) (specs/sites-assets-leases AC-2 · DISC-015)
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ROLE, ROLE_NAME, SCR, SCREENS, canAccess, type RoleId, type ScrId, type User } from '@boomeyes/domain';
  import {
    Badge,
    Button,
    Checkbox,
    DataTable,
    EmptyState,
    Inspector,
    KeyValueList,
    PageHeader,
    Select,
    StatusPill,
    toast,
    type Column,
  } from '@boomeyes/ui';
  import { login, session } from '$lib/session.svelte';
  let { data } = $props();
  const STATUS_LABEL = { active: '활성', suspended: '정지' } as const;
  const ROLES = Object.keys(ROLE) as RoleId[];
  let picked = $state<string | null>(null);
  const selected = $derived(data.users.find((u) => u.id === (picked ?? data.user)) ?? data.users[0] ?? null);
  const screensOf = (role: RoleId) => (Object.keys(SCREENS) as ScrId[]).filter((id) => canAccess(role, id));
  const statusOf = (u: User) => u.status ?? 'active';
  let siteSel = $state<string[]>([]);
  $effect(() => {
    if (selected) siteSel = [...selected.siteIds];
  });
  const sitesDirty = $derived(!!selected && [...siteSel].sort().join() !== [...selected.siteIds].sort().join());
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
  const select = (id: string) => {
    picked = id;
    goto(resolve(`/b4/users?user=${id}` as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
  const setRole = (u: User, role: RoleId) =>
    run(`역할 — ${u.display} → ${ROLE_NAME[role]}`, async () => {
      const saved = await data.api.setUserRole(u.id, role);
      // 내 계정이면 세션 역할도 바꿔 라우트 가드·내비가 즉시 따른다
      if (session.user?.userId === u.id) login({ ...session.user, role: saved.role });
    });
  const COLS: Column[] = [
    { key: 'id', label: '계정' },
    { key: 'display', label: '이름' },
    { key: 'role', label: '역할' },
    { key: 'org', label: '소속' },
    { key: 'sites', label: '현장 범위' },
    { key: 'status', label: '상태' },
  ];
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B4-04']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader
      title="사용자·권한"
      description="7역할 × 데모 계정 7 — 역할 · 현장 범위 · 상태. 접근 화면은 라우트 가드와 같은 canAccess로 계산한다 · 운영사는 안전관리자(site-safety) 권한을 부여할 수 없다(entities.rules) · 계정 발급·인증키 정책은 DISC-020"
    />
    <DataTable
      columns={COLS}
      rows={data.users}
      rowKey={(u: User) => u.id}
      selectedKey={selected?.id ?? null}
      onselect={(row: User) => select(row.id)}
      caption="사용자 목록"
    >
      {#snippet cell(row: User, col: Column)}
        {@const key = col.key}
        {#if key === 'id'}<span class="text-code-md">{row.id}</span>
        {:else if key === 'display'}{row.display}
        {:else if key === 'role'}{ROLE_NAME[row.role]}
        {:else if key === 'org'}{row.org}
        {:else if key === 'sites'}{row.siteIds.length ? row.siteIds.join(' · ') : '전체'}
        {:else if key === 'status'}<StatusPill
            tone={statusOf(row) === 'active' ? 'success' : 'danger'}
            label={STATUS_LABEL[statusOf(row)]}
            size="sm"
          />
        {/if}
      {/snippet}
    </DataTable>
  </div>
  <Inspector label="사용자 상세">
    {#if selected}
      {@const screens = screensOf(selected.role)}
      <h2 class="text-heading-sm">{selected.display} <span class="text-label-md text-fg-muted">{selected.id}</span></h2>
      <KeyValueList
        items={[
          { label: '소속', value: selected.org },
          { label: '역할', value: ROLE_NAME[selected.role] },
          {
            label: '접근 화면',
            value: `${screens.length}개 — ${screens.slice(0, 4).join(' · ')}${screens.length > 4 ? ' …' : ''}`,
          },
        ]}
      />
      <Select
        label="역할"
        value={selected.role}
        options={ROLES.map((r) => ({ value: r, label: ROLE_NAME[r], disabled: r === 'site-safety' }))}
        help="안전관리자는 부여 불가 — 법적 안전관리 책임은 건설사"
        disabled={busy}
        onchange={(e) => setRole(selected, e.currentTarget.value as RoleId)}
      />
      <fieldset class="gap-stack-xs flex flex-col">
        <legend class="text-label-md text-fg-muted">현장 범위 {siteSel.length ? '' : '(전체)'}</legend>
        {#each data.sites as s (s.id)}
          <Checkbox
            label={s.name}
            checked={siteSel.includes(s.id)}
            disabled={busy}
            onchange={() => (siteSel = siteSel.includes(s.id) ? siteSel.filter((x) => x !== s.id) : [...siteSel, s.id])}
          />
        {/each}
        <Button
          variant="outline"
          tone="neutral"
          size="sm"
          disabled={busy || !sitesDirty}
          onclick={() =>
            run(`현장 범위 — ${selected.display}`, () => data.api.setUserSites(selected.id, $state.snapshot(siteSel)))}
          >현장 범위 저장</Button
        >
      </fieldset>
      <Select
        label="상태"
        value={statusOf(selected)}
        options={[
          { value: 'active', label: STATUS_LABEL.active },
          { value: 'suspended', label: STATUS_LABEL.suspended },
        ]}
        disabled={busy}
        onchange={(e) =>
          run(`상태 — ${selected.display} ${STATUS_LABEL[e.currentTarget.value as 'active' | 'suspended']}`, () =>
            data.api.setUserStatus(selected.id, e.currentTarget.value as 'active' | 'suspended'),
          )}
      />
      {#if selected.id === session.user?.userId}<Badge tone="info"
          >내 계정 — 역할을 바꾸면 세션·내비가 즉시 바뀐다</Badge
        >{/if}
    {:else}
      <EmptyState title="사용자를 선택하세요" />
    {/if}
  </Inspector>
</div>
