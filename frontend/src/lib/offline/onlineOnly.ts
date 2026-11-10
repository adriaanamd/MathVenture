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

export function requireOnlineOnly(isOnline = isBrowserOnline()): void {
  if (!isOnline) throw new OnlineOnlyError();
}
