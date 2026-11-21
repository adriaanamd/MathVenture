import { describe, expect, it, vi } from 'vitest';

const invoke = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/client', () => ({
  supabase: { functions: { invoke } },
}));

import { invokeFunction } from './transport';

describe('invokeFunction error handling', () => {
  it('uses the original error message when context.json is not callable', async () => {
    invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network request failed', context: { status: 0 } },
    });

    await expect(invokeFunction('offline-bootstrap')).rejects.toThrow('Network request failed');
  });
});
