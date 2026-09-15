import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// 앱마다 같은 <head>(글꼴·Leaflet·manifest·아이콘)를 베끼면 반드시 어긋난다.
// src/shared/head.html 한 곳에 두고 <!-- shared:head --> 자리에 끼워 넣는다.
const sharedHead = {
  name: 'shared-head',
  transformIndexHtml: (html: string) =>
    html.replace('<!-- shared:head -->', readFileSync('src/shared/head.html', 'utf8').trim()),
};

// 앱 이름은 <대상>-<플랫폼>이다 — 한 역할이 웹과 폰을 둘 다 갖기 때문이다(docs/APPS.md).
// 새 앱을 더하려면 두 줄이면 된다:
//   1. <앱>.html 을 만들고 <script type="module" src="/src/apps/<앱>/main.ts">를 넣는다
//   2. 아래 input에 한 줄 더한다
// 공용은 src/shared 에 있다. 빌드는 앱마다 따로 묶고, 공용은 공유 청크로 빠진다.
export default defineConfig({
  plugins: [sharedHead],
  build: {
    rollupOptions: {
      input: {
        'owner-web': 'index.html',
        'hq-web': 'hq-web.html',
        // 'site-web': 'site-web.html',   // 현장 안전관리자 (아카이브 B3)
      },
    },
  },
  server: { port: 4300, strictPort: true },
  preview: { port: 4301, strictPort: true },
});
