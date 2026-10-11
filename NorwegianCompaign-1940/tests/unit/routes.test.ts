import { it, expect } from 'vitest';
import { lineD } from '../../src/map2d/dynamicLayers';
it('emits no incomplete SVG command before an air or naval route starts', () => {
  expect(lineD([[]])).toBe('');
  expect(lineD([[[10,20]]])).toBe('');
  expect(lineD([[],[[10,20],[30,40]]])).toBe('M10.0,20.0L30.0,40.0');
});
