import { DesktopPlatform } from './desktop-platform';
import { WebPlatform } from './web-platform';
import { PlatformAdapter } from './types';

export function getPlatformAdapter(): PlatformAdapter {
  if (typeof window !== 'undefined' && window.fileStorage) {
    return new DesktopPlatform();
  }

  return new WebPlatform();
}

export type { PlatformAdapter, PlatformProject } from './types';
