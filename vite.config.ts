import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves project sites under /<repo-name>/ — set
  // VITE_BASE_PATH=/<repo-name>/ in the deploy workflow (defaults to '/').
  base: process.env.VITE_BASE_PATH || '/',
});
