import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
      },
      // 정적 SPA (ADR-007) — 서버 세션 요구(DISC-020) 전까지 adapter-node 전환 없음
      adapter: adapter({ fallback: 'index.html', strict: false }),
      // 절대 경로(/_app/…): 폴백 파일은 원래 절대지만 vite preview는 /를 상대(./_app)로 렌더 → SW가 캐시한 셸이 /a2/login 오프라인에서 깨졌다. preview·배포를 같은 경로로 (shell-auth design 설치 절)
      paths: { relative: false },
      // 앱 정보(A1-07·A2-06)의 버전 표기 — $app/environment version
      version: { name: pkg.version },
    }),
  ],
});
