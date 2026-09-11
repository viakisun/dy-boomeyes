<script lang="ts">
  // 소유주 로그인 — 실제 로그인 화면 기준: 아이디 · 비밀번호(표시 토글) · 로그인 상태 유지 · 비밀번호 찾기 · 로그인 · 오류 한 줄.
  // 데모 계정은 보조 링크가 채워 넣는다(화면에 계정 ID를 쓰지 않는다). 인증은 앱의 onlogin이 mock으로 판정한다(DISC-020).
  import { OWNER_DEMO_LOGIN, type OwnerApp } from '@boomeyes/domain';
  import Eye from '@lucide/svelte/icons/eye';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import Logo from '../brand/Logo.svelte';
  import Button from '../primitives/Button.svelte';
  import TextField from '../primitives/TextField.svelte';
  import Checkbox from '../primitives/Checkbox.svelte';
  import Badge from '../primitives/Badge.svelte';
  import IconButton from '../primitives/IconButton.svelte';
  let {
    app,
    onlogin,
    screen,
  }: { app: OwnerApp; onlogin: (userId: string, password: string) => Promise<void>; screen: string } = $props();
  let userId = $state('');
  let password = $state('');
  let remember = $state(false);
  let show = $state(false);
  let busy = $state(false);
  let error = $state('');
  async function submit(id = userId, pw = password) {
    if (busy) return;
    busy = true;
    error = '';
    try {
      await onlogin(id, pw);
    } catch (e) {
      error = e instanceof Error ? e.message : '로그인하지 못했습니다.';
    } finally {
      busy = false;
    }
  }
  function demo() {
    userId = OWNER_DEMO_LOGIN.userId;
    password = OWNER_DEMO_LOGIN.password;
    void submit(OWNER_DEMO_LOGIN.userId, OWNER_DEMO_LOGIN.password);
  }
</script>

<main
  data-scr={screen}
  data-owner-view="entry"
  data-owner-root
  data-owner-app={app}
  data-density="comfortable"
  class="bg-canvas text-fg p-page-gutter flex min-h-dvh flex-col items-center justify-center"
>
  <section
    class="rounded-card bg-surface shadow-raised p-inset-xl gap-stack-lg max-w-layout-form-max flex w-full flex-col"
    aria-labelledby="owner-login-title"
  >
    <div class="gap-stack-md flex flex-col items-center text-center">
      <Logo variant="lockup" color label="BoomEyes" class="h-size-avatar-lg w-auto" />
      <h1 id="owner-login-title" class="text-heading-xl">로그인</h1>
    </div>
    <form
      class="gap-stack-md flex flex-col"
      novalidate
      onsubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <TextField
        label="아이디"
        name="username"
        autocomplete="username"
        bind:value={userId}
        error={error && !userId ? '아이디를 입력하세요.' : undefined}
      />
      <TextField
        label="비밀번호"
        name="password"
        type={show ? 'text' : 'password'}
        autocomplete="current-password"
        bind:value={password}
        error={error && !password ? '비밀번호를 입력하세요.' : undefined}
      >
        {#snippet suffix()}
          <IconButton
            variant="ghost"
            tone="neutral"
            size="sm"
            label={show ? '비밀번호 숨기기' : '비밀번호 표시'}
            aria-pressed={show}
            onclick={() => (show = !show)}
            >{#if show}<EyeOff class="size-size-icon-sm" aria-hidden="true" />{:else}<Eye
                class="size-size-icon-sm"
                aria-hidden="true"
              />{/if}</IconButton
          >
        {/snippet}
      </TextField>
      <div class="gap-inline-md flex flex-wrap items-center justify-between">
        <Checkbox label="로그인 상태 유지" bind:checked={remember} />
        <Button variant="link" tone="neutral" type="button" title="준비 중" aria-disabled="true">비밀번호 찾기</Button>
      </div>
      {#if error && userId && password}<p role="alert" class="text-danger-fg text-body-sm">{error}</p>{/if}
      <Button type="submit" size="lg" block loading={busy}>로그인</Button>
    </form>
    <div class="gap-inline-md border-border-subtle pt-stack-md flex flex-wrap items-center justify-between border-t">
      <Button variant="ghost" tone="neutral" type="button" onclick={demo} disabled={busy}>데모 계정으로 로그인</Button>
      <Badge variant="outline">데모 환경</Badge>
    </div>
  </section>
  <footer class="gap-inline-lg text-body-sm text-fg-muted mt-stack-lg flex flex-wrap justify-center">
    <Button variant="link" tone="neutral" type="button" title="준비 중" aria-disabled="true">도움말</Button>
    <Button variant="link" tone="neutral" type="button" title="준비 중" aria-disabled="true">이용약관</Button>
    <Button variant="link" tone="neutral" type="button" title="준비 중" aria-disabled="true">개인정보 처리방침</Button>
  </footer>
</main>
