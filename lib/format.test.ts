import { describe, it, expect } from 'vitest';
import { formatIDR } from './format';

describe('formatIDR', () => {
  it('formats thousands with Indonesian grouping', () => {
    expect(formatIDR(125000)).toBe('Rp 125.000');
  });

  it('formats zero', () => {
    expect(formatIDR(0)).toBe('Rp 0');
  });

  it('formats millions with multiple separators', () => {
    expect(formatIDR(1500000)).toBe('Rp 1.500.000');
  });
});
