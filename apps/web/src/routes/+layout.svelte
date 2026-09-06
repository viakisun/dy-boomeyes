<script lang="ts">
  import '../app.css';
  import { goto, invalidateAll } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { resolve } from '$app/paths';
  import { HOME_OF, SCREENS, type RoleId } from '@boomeyes/domain';
  import {
    Button,
    DemoBar,
    EmptyState,
    IconButton,
    IconLogOut,
    IconMoon,
    IconSun,
    Toast,
    WebShell,
    applyTheme,
    crumbsFor,
    navFor,
    theme,
    toggleTheme,
  } from '@boomeyes/ui';
  import { logout, session } from '$lib/session.svelte';
  let { data, children } = $props();
  const role = $derived(session.user?.role as RoleId | undefined);
  const groups = $derived(role ? navFor(role, 'web', data.screen, (p) => resolve(p as '/')) : []);
  const crumbs = $derived(data.screen ? crumbsFor(data.screen) : []);
  const home = () => role && goto(resolve(SCREENS[HOME_OF[role]].route as '/'));
  // 테마(shell-auth AC-6): ?theme=은 루트 data-theme에 적용만(저장 안 함) · 탑바 토글은 localStorage에 유지
  $effect(() => {
    if (data.theme) applyTheme(data.theme, false);
  });
  const dark = $derived(theme.value ? theme.value === 'dark' : theme.system);
  // 시연 장면 바(specs/demo-scripts AC-7): 이웃 장면 링크(다른 앱이면 절대 URL — PUBLIC_*_URL, preview 기본 포트) · 장면 6 "1시간 경과"
  const APP = 'web';
  const OTHER = (env.PUBLIC_PWA_URL ?? 'http://localhost:4174').replace(/\/$/, '');
  const sceneHref = (n: number) => {
    const s = data.scenes.find((x) => x.scene === n);
    if (!s) return undefined;
    return s.app === APP ? resolve(s.entry as '/') + `?scene=${n}` : `${OTHER}${s.entry}?scene=${n}`;
  };
  const jump = () => {
    data.jumpHour();
    invalidateAll();
  };
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
      <IconButton label={dark ? '라이트 모드' : '다크 모드'} onclick={toggleTheme}>
        {#if dark}<IconSun class="size-size-icon-md" aria-hidden="true" />{:else}<IconMoon
            class="size-size-icon-md"
            aria-hidden="true"
          />{/if}
      </IconButton>
      <IconButton
        label="로그아웃"
        onclick={() => {
          logout();
          data.resetMock(); // 다음 로그인은 새 시드로
          goto(resolve('/login'));
        }}><IconLogOut class="size-size-icon-md" aria-hidden="true" /></IconButton
      >
    {/snippet}
    {#snippet bar()}
      {#if data.scene}
        <DemoBar
          scene={data.scene.scene}
          total={data.scenes.length}
          title={data.scene.title}
          prev={sceneHref(data.scene.scene - 1)}
          next={sceneHref(data.scene.scene + 1)}
          onjump={data.scene.scene === 6 ? jump : undefined}
        />
      {/if}
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
  </WebShell>
{/if}
<Toast />
