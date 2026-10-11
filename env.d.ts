/// <reference types="vite/client" />
declare module 'virtual:campaign-catalog' {
  import type { CatalogEntry } from './hub/types';
  const catalog: CatalogEntry[];
  export default catalog;
}
