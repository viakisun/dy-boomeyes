<script lang="ts">
  import '../app.css';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { APP_HOME_OF, SCREENS, type Alert, type RoleId } from '@boomeyes/domain';
  import { Badge, Button, EmptyState, IconButton, PwaShell, Toast, connectivity, toast } from '@boomeyes/ui';
  import { navFor } from '$lib/nav';
  import { logout, session } from '$lib/session.svelte';
  let { data, children } = $props();
  const role = $derived(session.user?.role as RoleId | undefined);
  const tabs = $derived(
    role
      ? navFor(role, 'pwa', data.screen, (p) => resolve(p as '/'))
          .flatMap((g) => g.items)
          .slice(0, 5)
      : [],
  );
  const isLogin = $derived(data.screen?.endsWith('-01') && data.screen.startsWith('A'));
  const title = $derived(data.screen ? SCREENS[data.screen].name : 'BoomEyes');
  const home = () => {
    const h = role && APP_HOME_OF[role];
    if (h) goto(resolve(SCREENS[h].route as '/'));
  };
  // 실시간 알림(mock realtime, task-escalation AC-5) — 앱바 배지 + 토스트, 배지 탭 → 최신 알림의 업무
  let live = $state<Alert[]>([]);
  onMount(() =>
    data.realtime.subscribe((e) => {
      if (e.type !== 'alert.raised' || !session.user) return;
      live = [e.alert, ...live];
      toast(e.alert.message);
    }),
  );
  // 배지 탭 → 최신 알림의 업무(A1) 또는 앱 첫 화면. href는 템플릿에서 resolve()로 감싼다(no-navigation-without-resolve)
  const alertPath = $derived.by(() => {
    const a = live.find((x) => x.caseId) ?? live[0]; // 업무가 연결된 최신 알림 우선
    if (a?.caseId && data.surface === 'a1') return `/a1/inbox/${a.caseId}`;
    const h = role && APP_HOME_OF[role];
    return h ? SCREENS[h].route : '/';
  });
</script>

<svelte:head>
  <title>{title} · BoomEyes</title>
</svelte:head>

{#if isLogin || !session.user}
  {@render children()}
{:else}
  <PwaShell {title} {tabs} offline={!connectivity.online}>
    {#snippet actions()}
      {#if live.length}<a
          href={resolve(alertPath as '/')}
          aria-label="새 알림 {live.length}건"
          class="size-size-control-md rounded-control inline-flex items-center justify-center"
          onclick={() => (live = [])}><Badge tone="danger" count={live.length} /></a
        >{/if}
      <IconButton
        label="로그아웃"
        onclick={() => {
          logout();
          data.resetMock();
          goto(resolve(`/${data.surface}/login` as '/'));
        }}>⏻</IconButton
      >
    {/snippet}
    {#if data.forbidden}
      <EmptyState
        title="접근 권한이 없습니다"
        description="{session.user?.display} 역할은 이 화면을 볼 수 없습니다 (403)."
        tone="danger"
      >
        {#snippet action()}<Button onclick={home}>첫 화면으로</Button>{/snippet}
      </EmptyState>
    {:else}
      {@render children()}
    {/if}
  </PwaShell>
{/if}
<Toast position="bottom" />
