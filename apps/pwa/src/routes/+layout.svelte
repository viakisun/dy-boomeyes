<script lang="ts">
  import '../app.css';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { APP_HOME_OF, SCREENS, type RoleId } from '@boomeyes/domain';
  import { Button, EmptyState, IconButton, PwaShell, Toast } from '@boomeyes/ui';
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
</script>

{#if isLogin || !session.user}
  {@render children()}
{:else}
  <PwaShell {title} {tabs} scr={data.screen}>
    {#snippet actions()}<IconButton
        label="로그아웃"
        onclick={() => {
          logout();
          goto(resolve(`/${data.surface}/login` as '/'));
        }}>⏻</IconButton
      >{/snippet}
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
