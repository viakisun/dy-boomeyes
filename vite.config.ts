import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// 앱마다 같은 <head>(글꼴·Leaflet·manifest·아이콘)를 베끼면 반드시 어긋난다.
// src/shared/head.html 한 곳에 두고 <!-- shared:head --> 자리에 끼워 넣는다.
const sharedHead = {
  name: 'shared-head',
  transformIndexHtml: (html: string) =>
    html.replace('<!-- shared:head -->', readFileSync('src/shared/head.html', 'utf8').trim()),
};

// 역할마다 앱이 하나다. 새 역할을 더하려면 두 줄이면 된다:
//   1. <역할>.html 을 만들고 <script type="module" src="/src/apps/<역할>/main.ts">를 넣는다
//   2. 아래 input에 한 줄 더한다
// 공용은 src/shared 에 있다. 빌드는 앱마다 따로 묶고, 공용은 공유 청크로 빠진다.
export default defineConfig({
  plugins: [sharedHead],
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
