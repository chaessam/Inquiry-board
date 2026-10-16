import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// `npm run dev`는 화면만 띄웁니다. /api 요청은 `npm run serve`(wrangler)로 띄운 서버로 넘깁니다.
export default defineConfig({
  plugins: [preact()],
  // 글꼴 조각을 CSS 안에 끼워 넣지 않고 파일로 두어, 필요한 글자 조각만 받게 합니다.
  build: { assetsInlineLimit: 0 },
  server: {
    proxy: { '/api': 'http://localhost:8788' }
  }
});
