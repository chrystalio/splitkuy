import { describe, it, expect } from 'vitest';
import { cn } from './utils';

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
