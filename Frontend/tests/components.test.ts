import { describe, it, expect } from 'vitest';
import { cn } from '../src/lib/utils';

describe('Frontend Utils', () => {
  it('cn correctly merges conditional tailwind classes', () => {
    const result = cn('px-4 py-2', true && 'text-white', false && 'text-black', 'px-6');
    // twMerge should override px-4 with px-6
    expect(result).toContain('px-6');
    expect(result).toContain('text-white');
    expect(result).not.toContain('px-4');
  });
});
