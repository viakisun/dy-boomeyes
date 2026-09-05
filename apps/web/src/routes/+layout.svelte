<script lang="ts">
  import '../app.css';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { CURRENT_WAVE, HOME_OF, SCREENS, type RoleId } from '@boomeyes/domain';
  import { Button, EmptyState, IconButton, Toast, WebShell, applyTheme, theme, toggleTheme } from '@boomeyes/ui';
  import { navFor } from '$lib/nav';
  import { logout, session } from '$lib/session.svelte';
  let { data, children } = $props();
  const role = $derived(session.user?.role as RoleId | undefined);
  const groups = $derived(role ? navFor(role, 'web', data.screen, (p) => resolve(p as '/')) : []);
  const crumbs = $derived(
    data.screen ? [{ label: SCREENS[data.screen].surface }, { label: SCREENS[data.screen].name }] : [],
  );
  const home = () => role && goto(resolve(SCREENS[HOME_OF[role]].route as '/'));
  // 테마(shell-auth AC-6): ?theme=은 루트 data-theme에 적용만(저장 안 함) · 탑바 토글은 localStorage에 유지
  $effect(() => {
    if (data.theme) applyTheme(data.theme, false);
  });
  const dark = $derived(theme.value ? theme.value === 'dark' : theme.system);
</script>

<svelte:head>
  <title>{data.screen ? `${SCREENS[data.screen].name} · BoomEyes` : 'BoomEyes'}</title>
</svelte:head>

{#if data.screen === 'B0-01' || !session.user}
  {@render children()}
{:else}
  <WebShell {groups} {crumbs}>
    {#snippet brand()}<a href={resolve('/')} class="text-heading-sm text-accent-fg-strong">BoomEyes</a>{/snippet}
    {#snippet actions()}
      <span class="text-body-sm text-fg-muted">{session.user?.display} · {session.user?.org}</span>
      <IconButton label={dark ? '라이트 모드' : '다크 모드'} onclick={toggleTheme}>{dark ? '☀' : '☾'}</IconButton>
      <IconButton
        label="로그아웃"
        onclick={() => {
          logout();
          data.resetMock(); // 다음 로그인은 새 시드로
          goto(resolve('/login'));
        }}>⏻</IconButton
      >
    {/snippet}
    {#snippet footer()}<span class="text-label-sm text-fg-muted">wave {CURRENT_WAVE} · mock</span>{/snippet}
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
  </WebShell>
{/if}
<Toast />
