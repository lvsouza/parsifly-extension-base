import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';


export default defineConfig({
  build: {
    lib: {
      name: 'extensions',
      formats: ['cjs', 'es'],
      fileName: (format) => `index.${format}.js`,
      entry: ['./src/index.ts', './src/web-view/index.ts'],
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.ts'),
        'web-view': path.resolve(__dirname, 'src/web-view/index.ts'),
      },
      external: [], // adicione dependências aqui se quiser excluir do bundle
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'web-view') {
            return 'web-view/index.[format].js'
          }
          return 'index.[format].js'
        }
      }
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [dts({
    entryRoot: 'src',
    outDir: 'dist/types',
    include: ['src'],
  })],
})
