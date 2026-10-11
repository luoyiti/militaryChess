import { defineConfig } from 'vite';
import { campaignsPlugin, discoverCampaigns, buildable } from './tools/vite/catalog';

/** 旧版独立战役目录（迁移完成后删除）：排除出监听与依赖扫描 */
const LEGACY = ['InvasionOfPoland-1939', 'BattleOfFrance-1940', 'NorwegianCompaign-1940', 'BattleOfBritain-1940', 'BalkansCampaign-1941', 'BattleOfCrete-1941', 'barbarossa-1941'];

export default defineConfig(({ command }) => {
  const dev = command === 'serve';
  // 多页面：总台 + 每个可构建的战役页面（自动发现 campaigns/*/campaign.json）
  const input: Record<string, string> = { hub: 'index.html' };
  for (const c of discoverCampaigns()) if (buildable(c, dev)) input[c.id] = `campaigns/${c.id}/index.html`;
  return {
    base: './',
    appType: 'mpa',
    plugins: [campaignsPlugin()],
    server: {
      host: '127.0.0.1', port: 5180, strictPort: true,
      watch: { ignored: [...LEGACY.map((d) => `**/${d}/**`), '**/.work/**', '**/.cache/**', '**/.baselines/**', '**/pipeline/**'] },
    },
    preview: { host: '127.0.0.1', port: 4180, strictPort: true },
    // 一次性预构建全部依赖，避免开发中途重新优化
    optimizeDeps: {
      entries: Object.values(input),
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
      emptyOutDir: false, // 不批量清空 dist（本机环境会拦截批量删除）；产物文件名带哈希，旧文件无害（npm run clean 可清理）
      rollupOptions: {
        input,
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/three')) return 'three';
            if (id.includes('node_modules/d3-') || id.includes('topojson')) return 'd3';
          },
        },
      },
    },
    worker: { format: 'es' },
  };
});
