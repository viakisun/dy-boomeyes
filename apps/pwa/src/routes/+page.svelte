<script lang="ts">
  import { SCREENS, CURRENT_WAVE } from '@boomeyes/domain/generated/ids';
  const app = 'pwa';
  const mine = Object.entries(SCREENS).filter(([, s]) => s.app === app && s.wave <= CURRENT_WAVE);
</script>

<main class="p-inset-lg">
  <h1 class="text-heading-xl">BoomEyes pwa</h1>
  <p class="text-body-md text-fg-muted">웨이브 {CURRENT_WAVE} 화면 {mine.length}개 — 스캐폴드 확인용 임시 페이지</p>
  <ul class="mt-stack-md">
    {#each mine as [id, s] (id)}
      <!-- 임시 스캐폴드 페이지 — 실제 내비는 셸(task 3)에서 resolve() 사용 -->
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <li class="text-body-sm"><a class="text-fg-link" href={s.route}>{id} {s.name}</a></li>
    {/each}
  </ul>
</main>
