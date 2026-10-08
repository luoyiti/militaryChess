import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5188, strictPort: true },
  preview: { host: '127.0.0.1', port: 4188, strictPort: true },
  // 一次性预构建全部依赖，避免开发中途重新优化（重新优化会批量删除缓存目录，本机环境会拦截并导致服务退出）
  optimizeDeps: {
    include: [
      'd3-geo', 'd3-zoom', 'd3-selection', 'd3-contour', 'd3-interpolate', 'd3-shape', 'd3-array',
      'topojson-client', 'howler', 'gsap', 'three',
      'three/examples/jsm/controls/OrbitControls.js',
      'three/examples/jsm/renderers/CSS2DRenderer.js',
    ],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 0,
    emptyOutDir: false, // 不批量清空 dist（同上原因）；产物文件名带哈希，旧文件无害
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/d3-') || id.includes('topojson')) return 'd3';
        },
      },
    },
  },
  worker: { format: 'es' },
});
