import { describe, it, expect } from 'vitest';
import { cn, genId } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('skips falsy values', () => {
    expect(cn('a', false, 'b', undefined, 'c')).toBe('a b c');
  });

  it('dedupes conflicting tailwind classes via tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('genId', () => {
  it('produces a unique id each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => genId()));
    expect(ids.size).toBe(100);
  });

  it('returns a non-empty string', () => {
    expect(genId().length).toBeGreaterThan(0);
  });
});
