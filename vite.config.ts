import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';
import path from 'path';

// フロントのソースはclient/、ビルド成果物はpublic/へ出力
export default defineConfig((): UserConfig => {
  const rootDir: string = path.resolve(__dirname, 'client');
  const outDir: string = path.resolve(__dirname, 'public');

  return {
    root: rootDir,
    base: '/',
    build: {
      outDir,
      emptyOutDir: true,
    },
  };
});
