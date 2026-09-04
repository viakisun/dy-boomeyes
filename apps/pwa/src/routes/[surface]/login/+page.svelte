<script lang="ts">
  // A1-01 · A2-01 · A3-01 · A4-01 앱 로그인 — 표면 1개 = 역할 1개, 데모 계정 진입 (specs/shell-auth AC-1)
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { APP_HOME_OF, SCREENS, type RoleId, type User } from '@boomeyes/domain';
  import { Button, Card } from '@boomeyes/ui';
  import { login } from '$lib/session.svelte';
  let { data } = $props();
  const ROLE_OF: Record<string, { role: RoleId; title: string; desc: string }> = {
    a1: { role: 'site-safety', title: '현장 안전관리자', desc: '업무함 · 관제 · 기록' },
    a2: { role: 'driver', title: '운전자', desc: '출근 · 일일점검 · 내 장비 · 서류' },
    a3: { role: 'hq-safety', title: '본사 안전관리자', desc: '자사 전 현장 열람 · 확인 요청' },
    a4: { role: 'owner', title: '사업주', desc: '보유·가용 · 투입 요청 · 운전자 배치 (2단계)' },
  };
  const meta = $derived(ROLE_OF[page.params.surface ?? 'a1']);
  let users = $state<User[]>([]);
  $effect(() => {
    data.api.users().then((u) => (users = u));
  });
  const demo = $derived(users.find((x) => x.role === meta?.role));
  async function enter() {
    const u = demo;
    if (!meta || !u) return;
    login({ userId: u.id, role: u.role, display: u.display, org: u.org });
    const h = APP_HOME_OF[meta.role];
    if (h) await goto(resolve(SCREENS[h].route as '/'));
  }
</script>

<main
  class="max-w-layout-frame-mobile gap-stack-xl bg-canvas px-page-gutter py-stack-xl mx-auto flex min-h-dvh w-full flex-col justify-center"
  data-scr={data.screen}
  data-capture-frame
>
  <div class="gap-stack-xs flex flex-col">
    <p class="text-label-lg text-accent-fg">DY · BoomEyes(가칭)</p>
    <h1 class="text-display-md">{meta?.title ?? '앱'} 로그인</h1>
    <p class="text-body-md text-fg-muted">{meta?.desc}</p>
  </div>
  <Card variant="brand">
    <span class="text-label-md text-fg-muted">데모 계정</span>
    <span class="text-heading-md"
      >{demo?.display ?? '…'}
      <span class="text-body-sm text-fg-muted">({demo?.id ?? '…'})</span></span
    >
    <Button size="lg" block onclick={enter} disabled={!demo}>입장</Button>
  </Card>
  <p class="text-body-sm text-fg-muted text-center">실인증·가입은 DISC-020 · DISC-023 확정 후</p>
</main>
