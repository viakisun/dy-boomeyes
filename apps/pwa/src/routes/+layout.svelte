<script lang="ts">
  import '../app.css';
  import { goto, invalidateAll } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { APP_HOME_OF, SCREENS, toPushPayload, type Alert, type PushSurface, type RoleId } from '@boomeyes/domain';
  import type { OutboxState } from '@boomeyes/offline';
  import {
    Badge,
    BottomSheet,
    Button,
    DemoBar,
    EmptyState,
    IconBell,
    IconButton,
    IconLogOut,
    Logo,
    PwaShell,
    Toast,
    applyTheme,
    connectivity,
    navFor,
    toast,
  } from '@boomeyes/ui';
  import { notify, push, requestPush } from '$lib/push.svelte';
  import { logout, session } from '$lib/session.svelte';
  let { data, children } = $props();
  // 알림 권한 시트(specs/notifications AC-1) — 종 아이콘으로 열고, ?state=push(A1-02 픽스처)면 레이아웃이 연다
  let sheet = $state(false);
  let touched = $state(false); // 이 세션에서 권한을 요청했으면 실 권한을 보인다
  const perm = $derived(data.pushDemo && !touched ? 'default' : push.permission);
  $effect(() => {
    if (data.pushSheet) sheet = true;
  });
  const enablePush = async () => {
    touched = true;
    const r = await requestPush();
    toast(r === 'granted' ? '알림 켜짐' : '알림이 허용되지 않았습니다 — 브라우저 설정에서 허용하세요');
  };
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
  // 시연 장면 바(specs/demo-scripts AC-7): 이웃 장면 링크(다른 앱이면 절대 URL — PUBLIC_*_URL, preview 기본 포트) · 장면 6 "1시간 경과"
  const APP = 'pwa';
  const OTHER = (env.PUBLIC_WEB_URL ?? 'http://localhost:4173').replace(/\/$/, '');
  const sceneHref = (n: number) => {
    const s = data.scenes.find((x) => x.scene === n);
    if (!s) return undefined;
    return s.app === APP ? resolve(s.entry as '/') + `?scene=${n}` : `${OTHER}${s.entry}?scene=${n}`;
  };
  const jump = () => {
    data.jumpHour();
    invalidateAll();
  };
  // 테마: PWA는 시스템 다크를 따르고 강제하지 않는다(DY-design §10) — ?theme=은 캡처·e2e용 루트 적용만
  $effect(() => {
    if (data.theme) applyTheme(data.theme, false);
  });
  const home = () => {
    const h = role && APP_HOME_OF[role];
    if (h) goto(resolve(SCREENS[h].route as '/'));
  };
  // 오프라인 제출 큐(ADR-010) — 배너 상태 · 전송 성공/거부 뒤 다시 읽기 · 실패·거부 토스트
  let box = $state<OutboxState>(data.outbox.state());
  $effect(() => {
    const ob = data.outbox;
    box = ob.state();
    return ob.subscribe((s, e, detail) => {
      box = s;
      if (e === 'sent' || e === 'rejected') void invalidateAll();
      if (e === 'failed') toast(`전송 실패 ${s.failed}건 — 배너에서 재시도`, { tone: 'danger' });
      if (e === 'rejected') toast(`거부됨 — ${detail ?? ''}`, { tone: 'danger' });
    });
  });
  // 실시간 알림(mock realtime, task-escalation AC-5) — 앱바 배지 + 토스트, 배지 탭 → 최신 알림의 업무
  let live = $state<Alert[]>([]);
  onMount(() =>
    data.realtime.subscribe((e) => {
      if (e.type !== 'alert.raised' || !session.user) return;
      live = [e.alert, ...live];
      toast(e.alert.message);
      void notify(toPushPayload(e.alert, data.surface as PushSurface)); // 권한 granted일 때만 기기 알림(ADR-009)
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
  <PwaShell
    {title}
    {tabs}
    offline={!connectivity.online || data.net === 'off'}
    queued={box.queued}
    failed={box.failed}
    syncing={box.syncing}
    onsync={() => void (box.failed ? data.outbox.retry() : data.outbox.sync())}
  >
    {#snippet logo()}<Logo variant="glyph" class="size-size-icon-lg" />{/snippet}
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
    {#snippet actions()}
      {#if live.length}<a
          href={resolve(alertPath as '/')}
          aria-label="새 알림 {live.length}건"
          class="size-size-control-md rounded-control inline-flex items-center justify-center"
          onclick={() => (live = [])}><Badge tone="danger" count={live.length} /></a
        >{/if}
      <IconButton label={perm === 'granted' ? '알림 켜짐' : '알림 설정'} class="relative" onclick={() => (sheet = true)}
        ><IconBell class="size-size-icon-md" aria-hidden="true" />{#if perm === 'default'}<span
            class="bg-accent rounded-pill size-size-indicator top-inset-xs right-inset-xs absolute"
            aria-hidden="true"
          ></span>{/if}</IconButton
      >
      <IconButton
        label="로그아웃"
        onclick={() => {
          logout();
          data.resetMock();
          goto(resolve(`/${data.surface}/login` as '/'));
        }}><IconLogOut class="size-size-icon-md" aria-hidden="true" /></IconButton
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
  <BottomSheet bind:open={sheet} title="알림" capture>
    <div class="gap-stack-sm flex flex-col" data-push={perm}>
      {#if perm === 'granted'}
        <p class="text-body-md">알림이 켜져 있습니다 — 고장·에스컬레이션·서류 알림이 오면 기기 알림으로 보입니다.</p>
      {:else if perm === 'denied'}
        <p class="text-body-md">
          알림이 차단되어 있습니다. 브라우저 설정에서 이 사이트의 알림을 허용한 뒤 다시 여세요.
        </p>
      {:else if perm === 'unsupported'}
        <p class="text-body-md">이 환경은 기기 알림을 지원하지 않습니다 — iOS는 홈 화면에 추가한 앱에서만 됩니다.</p>
      {:else}
        <p class="text-body-md">
          고장·에스컬레이션·서류 알림을 기기 알림으로 받으려면 권한이 필요합니다. 인앱 배지·토스트는 그대로 동작합니다.
        </p>
      {/if}
      <p class="text-label-sm text-fg-muted" data-ref="DISC-036">문자·전화 알림은 준비 중입니다</p>
    </div>
    {#snippet footer()}
      {#if perm === 'default'}<Button size="lg" block onclick={enablePush}>알림 켜기</Button>{/if}
      <Button size="lg" block variant="ghost" tone="neutral" onclick={() => (sheet = false)}>닫기</Button>
    {/snippet}
  </BottomSheet>
{/if}
<Toast position="bottom" />
