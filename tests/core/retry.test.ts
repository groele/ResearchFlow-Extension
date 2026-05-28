import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../../src/core/retry';

describe('withRetry', () => {
  it('returns immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on transient errors and eventually succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting all retries', async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError('Network error'));

    await expect(withRetry(fn, { maxAttempts: 3, baseDelay: 10 }))
      .rejects.toThrow('Network error');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-transient errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Validation failed'));

    await expect(withRetry(fn, { maxAttempts: 3, baseDelay: 10 }))
      .rejects.toThrow('Validation failed');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 5xx errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('AI API returned status 503'))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on rate limit errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('respects custom isRetryable predicate', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('custom error'));

    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        baseDelay: 10,
        isRetryable: (e) => e instanceof Error && e.message === 'custom error',
      })
    ).rejects.toThrow('custom error');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
