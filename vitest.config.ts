import { defineConfig } from 'vitest/config';

// 引擎测试在 tests/，各战役的数据与行为测试在 campaigns/<id>/tests/（每个文件独立的模块环境，可各自初始化战役上下文）
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'campaigns/*/tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
