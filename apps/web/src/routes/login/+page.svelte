<script lang="ts">
  // B0-01 웹 공통 로그인 — 역할 카드 5(B1~B4 + 정비 담당) + 데모 계정 (specs/shell-auth AC-1·AC-5). 상태 login-b1..b4·login-maint = 카드 강조
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { HOME_OF, SCREENS, SURFACE_NAME, type RoleId, type SurfaceId, type User } from '@boomeyes/domain';
  import { Card } from '@boomeyes/ui';
  import { login } from '$lib/session.svelte';
  let { data } = $props();
  const CARDS: { role: RoleId; surface: SurfaceId; title: string; desc: string; state: string }[] = [
    {
      role: 'control',
      surface: 'B1',
      title: '운영사 관제',
      desc: '전국 CPB 관제 · 원격 진단 · 수신함 · 에스컬레이션',
      state: 'login-b1',
    },
    {
      role: 'hq-safety',
      surface: 'B2',
      title: '건설사 본사',
      desc: '자사 전 현장 열람 · 확인 요청 · 보고',
      state: 'login-b2',
    },
    {
      role: 'site-safety',
      surface: 'B3',
      title: '현장 안전관리자',
      desc: '현장 콘솔 · 업무 · 서류 · 기록',
      state: 'login-b3',
    },
    {
      role: 'ops-admin',
      surface: 'B4',
      title: '관리자 백오피스',
      desc: '장비·현장·사용자·프로토콜·알림 기준',
      state: 'login-b4',
    },
    {
      role: 'maintenance',
      surface: 'B1',
      title: '정비 담당',
      desc: '고장 출동 · 조치 보고 — 대시보드·수신함·에스컬레이션 열람',
      state: 'login-maint',
    },
  ];
  const stateParam = $derived(page.url.searchParams.get('state') ?? 'login-b1');
  let users = $state<User[]>([]);
  $effect(() => {
    data.api.users().then((u) => (users = u));
  });
  async function enter(role: RoleId) {
    const u = users.find((x) => x.role === role);
    if (!u) return;
    login({ userId: u.id, role: u.role, display: u.display, org: u.org });
    const next = page.url.searchParams.get('next');
    await goto(resolve((next ?? SCREENS[HOME_OF[role]].route) as '/'));
  }
</script>

<main class="gap-stack-xl bg-canvas p-page-gutter flex min-h-dvh flex-col items-center justify-center" data-scr="B0-01">
  <header class="text-center">
    <p class="text-label-lg text-accent-fg">DY · BoomEyes(가칭)</p>
    <h1 class="text-display-md">CPB 관제 로그인</h1>
    <p class="mt-stack-xs text-body-sm text-fg-muted" data-ref="DISC-020">
      역할 카드를 선택하면 데모 계정으로 들어갑니다
    </p>
  </header>
  <div class="max-w-layout-content-max gap-inline-lg grid w-full grid-cols-1 md:grid-cols-2">
    {#each CARDS as c (c.role)}
      <Card
        variant="interactive"
        as="button"
        selected={stateParam === c.state}
        onclick={() => enter(c.role)}
        aria-label="{c.title}로 로그인"
      >
        {#snippet header()}<span class="text-label-md text-fg-muted">{SURFACE_NAME[c.surface]}</span>{/snippet}
        <h2 class="text-heading-md">{c.title}</h2>
        <p class="text-body-sm text-fg-muted">{c.desc}</p>
        {#snippet footer()}<span class="text-label-md text-accent-fg"
            >{users.find((u) => u.role === c.role)?.id ?? '…'}</span
          ><span class="text-label-md text-accent-fg-strong">입장 →</span>{/snippet}
      </Card>
    {/each}
  </div>
</main>
