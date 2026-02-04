import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('returns single class unchanged', () => {
    expect(cn('bg-red-500')).toBe('bg-red-500');
  });

  it('merges multiple classes', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('handles conditional classes with falsy values', () => {
    expect(cn('base', false && 'hidden', null, undefined, 'visible')).toBe(
      'base visible'
    );
  });

  it('handles array of classes', () => {
    expect(cn(['bg-red-500', 'text-white'])).toBe('bg-red-500 text-white');
  });

  it('handles object notation', () => {
    expect(cn({ 'bg-red-500': true, 'text-white': false })).toBe('bg-red-500');
  });

  it('merges conflicting Tailwind classes (twMerge behavior)', () => {
    // Later classes should override earlier ones
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('handles complex combinations', () => {
    const result = cn(
      'base-class',
      ['array-class'],
      { 'object-true': true, 'object-false': false },
      null,
      undefined,
      'final-class'
    );
    expect(result).toBe('base-class array-class object-true final-class');
  });
});
