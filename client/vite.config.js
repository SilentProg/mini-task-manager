import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Під час розробки (npm run dev) запити /api проксуються на Express-сервер
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:3000'
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});
