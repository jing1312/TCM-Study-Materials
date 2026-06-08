import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        suite: fileURLToPath(new URL('./中医药学概论_3天备考全套.html', import.meta.url)),
        plan: fileURLToPath(new URL('./3天学习计划.html', import.meta.url)),
        flashcards: fileURLToPath(new URL('./速记卡片.html', import.meta.url)),
        mnemonics: fileURLToPath(new URL('./重点难点口诀.html', import.meta.url)),
        quiz: fileURLToPath(new URL('./自测模拟题.html', import.meta.url))
      }
    }
  }
});
