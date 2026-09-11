<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import OwnerPage from '$lib/OwnerPage.svelte';
  import { OwnerEntry, OwnerShell } from '@boomeyes/ui';
  import { ownerPath, OWNER_DEMO_LOGIN } from '@boomeyes/domain';
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
    Logo,
    Toast,
    WebShell,
    applyTheme,
    crumbsFor,
    navFor,
    theme,
    toggleTheme,
  } from '@boomeyes/ui';
  import { login, logout, session } from '$lib/session.svelte';
  let { data, children } = $props();
  const role = $derived(session.user?.role as RoleId | undefined);
  const groups = $derived(role ? navFor(role, 'web', data.screen, (p) => resolve(p as '/')) : []);
  const crumbs = $derived(data.screen ? crumbsFor(data.screen, (p) => resolve(p as '/')) : []);
  const home = () => role && goto(resolve(SCREENS[HOME_OF[role]].route as '/'));
  // 테마(shell-auth AC-6): ?theme=은 루트 data-theme에 적용만(저장 안 함) · 탑바 토글은 localStorage에 유지
  $effect(() => {
    if (data.theme) applyTheme(data.theme, false);
  });
  // 소유주 화면은 comfortable 밀도(토큰 원칙 6 — 밀도는 역할에서): 루트 data-density를 전환한다
  $effect(() => {
    document.documentElement.dataset.density = data.ownerView ? 'comfortable' : 'compact';
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
  // 소유주 로그인 — 실인증 전 mock 검증(DISC-020): 데모 계정(OWNER_DEMO_LOGIN)만 통과, 나머지는 같은 오류 문구
  async function ownerLogin(userId: string, password: string) {
    const ok = userId.trim() === OWNER_DEMO_LOGIN.userId && password === OWNER_DEMO_LOGIN.password;
    const user = ok ? (await data.api.users()).find((u) => u.id === OWNER_DEMO_LOGIN.userId) : undefined;
    if (!user?.ownerId) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    data.resetMock();
    data.resetOwner();
    login({ userId: user.id, role: user.role, display: user.display, org: user.org, ownerId: user.ownerId });
    const next = new URL(ownerPath('overview', 'web'), page.url.origin);
    for (const key of ['capture', 'state', 'theme']) {
      const value = page.url.searchParams.get(key);
      if (value) next.searchParams.set(key, value);
    }
    await goto(resolve((next.pathname + next.search) as '/'));
  }
  function ownerExit() {
    logout();
    data.resetMock();
    data.resetOwner();
    void goto(resolve(ownerPath('entry', 'web') as '/'));
  }
</script>

<svelte:head>
  <title>{data.screen ? `${SCREENS[data.screen].name} · BoomEyes` : 'BoomEyes'}</title>
</svelte:head>

{#if data.ownerView === 'entry'}
  <OwnerEntry app="web" screen={data.screen ?? ''} onlogin={ownerLogin} />
{:else if data.ownerView && data.ownerApi && !data.forbidden}
  <OwnerShell app="web" view={data.ownerView} url={page.url} onlogout={ownerExit}>
    <OwnerPage api={data.ownerApi} view={data.ownerView} capture={data.capture} />
  </OwnerShell>
{:else if data.screen === 'B0-01' || !session.user}
  {@render children()}
{:else}
  <WebShell {groups} {crumbs}>
    {#snippet brand(collapsed)}<a href={resolve('/')} aria-label="BoomEyes 홈" class="text-fg inline-flex items-center"
        ><Logo
          variant={collapsed ? 'glyph' : 'lockup'}
          class={collapsed ? 'size-size-icon-xl' : 'h-size-avatar-md w-auto'}
        /></a
      >{/snippet}
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
