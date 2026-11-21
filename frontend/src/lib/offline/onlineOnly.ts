export const ONLINE_ONLY_OFFLINE_MESSAGE = 'Check internet connection as this is online-only';

export class OnlineOnlyError extends Error {
  constructor() {
    super(ONLINE_ONLY_OFFLINE_MESSAGE);
    this.name = 'OnlineOnlyError';
  }
}

export function isBrowserOnline(): boolean {
  return typeof navigator === 'undefined'
    || (navigator as Navigator & { onLine?: boolean }).onLine !== false;
}

export function isNetworkFailure(error: unknown): boolean {
  const text = error instanceof Error
    ? `${error.name} ${error.message}`
    : typeof error === 'string' ? error : '';
  return /failed to fetch|fetch failed|networkerror|network request failed|load failed|internet disconnected|network changed|failed to send a request to the edge function/i.test(text);
}

export function requireOnlineOnly(isOnline = isBrowserOnline()): void {
  if (!isOnline) throw new OnlineOnlyError();
}
