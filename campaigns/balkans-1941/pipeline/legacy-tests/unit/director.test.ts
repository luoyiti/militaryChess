import { it, expect } from 'vitest';
import { Director } from '../../src/app/director';
import type { REvent } from '../../src/data/db';

it('accepts fractional event zoom as a relative camera scale', () => {
  const director = Object.create(Director.prototype) as Director;
  expect(director.zoomFor({ zoom: 5.2, importance: 1 } as REvent)).toBe(5.2);
});
