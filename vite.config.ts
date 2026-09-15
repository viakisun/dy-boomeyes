import { defineConfig } from 'vite';

// 역할마다 앱이 하나다. 새 역할을 더하려면 두 줄이면 된다:
//   1. <역할>.html 을 만들고 <script type="module" src="/src/apps/<역할>/main.ts">를 넣는다
//   2. 아래 input에 한 줄 더한다
// 공용은 src/shared 에 있다. 빌드는 앱마다 따로 묶고, 공용은 공유 청크로 빠진다.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        owner: 'index.html',
        builder: 'builder.html',
        // safety: 'safety.html',     // 안전관리자 앱
      },
    },
  },
  server: { port: 4300, strictPort: true },
  preview: { port: 4301, strictPort: true },
});
