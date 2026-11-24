export interface FreePlayMediaManifestEntry {
  url: string;
  bytes: number;
}

export interface FreePlayMediaManifest {
  schemaVersion: 1;
  version: string;
  totalFiles: number;
  totalBytes: number;
  entries: FreePlayMediaManifestEntry[];
}

export const FREE_PLAY_MEDIA_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.m4a',
  '.mp3',
  '.mp4',
  '.ogg',
  '.png',
  '.wav',
  '.webm',
  '.webp',
]);

export function isFreePlayMediaUrl(url: string): boolean {
  const pathname = new URL(url, 'https://mathventure.invalid').pathname;
  const extension = pathname.slice(pathname.lastIndexOf('.')).toLowerCase();
  return pathname.startsWith('/assets/') && FREE_PLAY_MEDIA_EXTENSIONS.has(extension);
}

export function isFreePlayMediaManifest(value: unknown): value is FreePlayMediaManifest {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<FreePlayMediaManifest>;
  return candidate.schemaVersion === 1
    && typeof candidate.version === 'string'
    && Number.isInteger(candidate.totalFiles)
    && typeof candidate.totalBytes === 'number'
    && Array.isArray(candidate.entries)
    && candidate.entries.every(
      (entry) => typeof entry?.url === 'string'
        && entry.url.startsWith('/assets/')
        && typeof entry.bytes === 'number'
        && entry.bytes >= 0,
    );
}
