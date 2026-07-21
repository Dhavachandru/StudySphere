import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local dev, Netlify functions aren't served. We proxy the frontend's
// /api/ai-chat endpoint to a configurable AI backend so the assistant works
// in Bolt Preview. In production (Netlify), a redirect maps /api/ai-chat to
// the real serverless function (see netlify.toml).
const devAiBase = process.env.AI_API_BASE || 'https://api.openai.com/v1';
const devAiKey = process.env.AI_API_KEY || '';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/ai-chat': {
        target: devAiBase,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai-chat/, '/chat/completions'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (devAiKey) proxyReq.setHeader('Authorization', `Bearer ${devAiKey}`);
          });
        },
      },
    },
  },
});

