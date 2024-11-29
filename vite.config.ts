import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';


export default defineConfig({
  build: {
    lib: {
      name: 'extensions',
      formats: ['cjs', 'es'],
      entry: './src/index.ts',
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [dts()],
})
