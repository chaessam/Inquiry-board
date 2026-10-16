import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// `npm run dev`는 화면만 띄웁니다. /api 요청은 `npm run serve`(wrangler)로 띄운 서버로 넘깁니다.
export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: { '/api': 'http://localhost:8788' }
  }
});
