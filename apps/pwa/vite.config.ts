import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
      },
      // 정적 SPA (ADR-007) — 서버 세션 요구(DISC-020) 전까지 adapter-node 전환 없음
      adapter: adapter({ fallback: 'index.html', strict: false }),
      // 절대 경로(/_app/…): 서비스 워커가 캐시한 셸(/)을 /a2/login 같은 깊은 경로에서 열어도 자산이 풀린다 (shell-auth AC-7)
      paths: { relative: false },
    }),
  ],
});
