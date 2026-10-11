/** 共享音频库（shared/audio）：通过打包器引入为带哈希的资源 URL，任意深度的页面都能正确引用。 */
import sfxWebm from '../../shared/audio/sfx.webm?url';
import sfxM4a from '../../shared/audio/sfx.m4a?url';
import sprite from '../../shared/audio/sfx-sprite.json';
import library from '../../shared/audio/music/library.json';

export const SFX_SRC = [sfxWebm, sfxM4a];
export const SFX_SPRITE = sprite.sprite as unknown as Record<string, [number, number] | [number, number, boolean]>;

const files = import.meta.glob('../../shared/audio/music/*.{webm,m4a}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const urlOf = (name: string) => files[`../../shared/audio/music/${name}`];

export interface MusicTrack { id: string; title: string; src: string[]; html5?: boolean; oneShot?: boolean }
interface LibraryEntry { id: string; title: string; files: string[]; html5?: boolean; oneShot?: boolean }

export function musicTrack(id: string): MusicTrack | null {
  const e = (library as LibraryEntry[]).find((x) => x.id === id);
  if (!e) return null;
  return { id: e.id, title: e.title, src: e.files.map(urlOf).filter(Boolean), html5: e.html5, oneShot: e.oneShot };
}
export const MUSIC_IDS = (library as LibraryEntry[]).map((e) => e.id);
