import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Automation Plugin: Create public/images and migrate assets on startup
const assetAutoManager = () => ({
  name: 'asset-auto-manager',
  buildStart() {
    const publicDir = path.resolve(process.cwd(), 'public');
    const imagesDir = path.resolve(publicDir, 'images');
    const sourceDir = path.resolve(process.cwd(), 'src/assets/images');

    // 1. Ensure folders exist
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    // 2. Migrate files from src/assets/images if they exist
    if (fs.existsSync(sourceDir)) {
      const files = fs.readdirSync(sourceDir);
      files.forEach(file => {
        const srcPath = path.join(sourceDir, file);
        const destPath = path.join(imagesDir, file);
        
        // Copy file if it doesn't exist in destination or is different
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log(`[Auto-Manager] Migrated asset: ${file} -> public/images/`);
        }
      });
    }
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), assetAutoManager()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
