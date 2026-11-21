import { assertEquals } from 'jsr:@std/assert';
import {
  ONLINE_ONLY_OFFLINE_MESSAGE,
  OnlineOnlyError,
  isNetworkFailure,
  requireOnlineOnly,
} from '../../../../src/lib/offline/onlineOnly.ts';

Deno.test('online-only policy uses the required exact offline message', () => {
  let error: unknown;
  try {
    requireOnlineOnly(false);
  } catch (caught) {
    error = caught;
  }
  if (!(error instanceof OnlineOnlyError)) throw new Error('Expected OnlineOnlyError.');
  assertEquals((error as OnlineOnlyError).message, ONLINE_ONLY_OFFLINE_MESSAGE);
});

Deno.test('online-only policy allows connected actions', () => {
  requireOnlineOnly(true);
});

Deno.test('network failure detection distinguishes transport errors from auth errors', () => {
  assertEquals(isNetworkFailure(new TypeError('Failed to fetch')), true);
  assertEquals(isNetworkFailure(new Error('Invalid login credentials')), false);
});
