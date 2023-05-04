import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig, Plugin } from 'vite'

function useScript(): Plugin {
  return {
    name: 'use-script',
    apply: 'build',
    transformIndexHtml: {
      enforce: 'post',
      transform(html) {
        // console.log(html)
        return html.replace(/<script type="module" crossorigin src=/g, '<script defer src=')
      },
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), useScript()],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },

  resolve: {
    alias: {
      'util': 'rollup-plugin-node-polyfills/polyfills/util.js',
      'node:util': 'rollup-plugin-node-polyfills/polyfills/util.js',
    },
  },

  base: './',

  build: {
    emptyOutDir: true,
    outDir: path.join(__dirname, '../src-plugin/dist/ui/'),
  },
})
