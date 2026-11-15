import { defineConfig } from 'vite';
import { renderStory } from './src/render.mjs';

export default defineConfig({
  base: process.env.PAGES_BASE || './',
  plugins: [{
    name: 'render-story',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const base = process.env.PAGES_BASE || './';
        return html.replace('<!-- story -->', renderStory(base));
      },
    },
  }],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
