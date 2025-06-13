// JSDOM necesita el módulo real 'http'; el proyecto lo stubea en setupTests y eso
// provoca "Class extends value undefined is not a constructor". Sobrescribimos ese
// mock para este archivo.
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateCacheServiceSettingsHtml } from '../../../src/dashboard/components/cacheServiceSettings';

import type { LocalCacheService } from '../../../src/local/localCacheService';
import type { RedisCacheService } from '../../../src/redis/redisCacheService';

/* -------------------------------------------------------------------------- */
/*                               Helper Utils                                */
/* -------------------------------------------------------------------------- */

type CacheSvc = LocalCacheService | RedisCacheService;

type PartialConfig = {
  ttl?: number;
  maxMemorySizeMB?: number;
};

/**
 * Minimal stub of a cache service exposing only `getConfig()` so we can render
 * the HTML component without pulling real dependencies.
 */
function makeFakeService(cfg: PartialConfig = {}): CacheSvc {
  return {
    getConfig: () => ({
      ttl: 3600,
      maxMemorySizeMB: 1024,
      ...cfg,
    }),
  } as unknown as CacheSvc;
}

/**
 * Renders the HTML and returns a JSDOM document for assertions.
 */
function render(cfg: PartialConfig = {}, identifier = 'fake‑svc') {
  const html = generateCacheServiceSettingsHtml(makeFakeService(cfg), identifier);
  return new JSDOM(html).window.document;
}

/* -------------------------------------------------------------------------- */
/*                                   Tests                                    */
/* -------------------------------------------------------------------------- */

describe('components › cacheServiceSettings', () => {
  it('shows the current TTL and memory size in the summary cards', () => {
    const doc = render({ ttl: 123, maxMemorySizeMB: 55.2 });

    const ttlText = doc.querySelector('h6')?.nextElementSibling?.textContent;
    const memText = doc.querySelectorAll('h6')[1]?.nextElementSibling?.textContent;

    expect(ttlText).toContain('123');
    expect(memText).toMatch(/55\.20\s*MB/);
  });

  it('prints “NO LIMIT” when maxMemorySizeMB is undefined', () => {
    const doc = render({ maxMemorySizeMB: undefined });
    const memText = doc.querySelectorAll('h6')[1]?.nextElementSibling?.textContent;

    expect(memText).toMatch(/NO LIMIT/);
  });

  it('adds the identifier suffix to input ids and the update button', () => {
    const identifier = 'service‑A';
    const doc = render({}, identifier);

    expect(doc.getElementById(`ttl-${identifier}`)).toBeTruthy();
    expect(doc.getElementById(`maxMemorySize-${identifier}`)).toBeTruthy();

    const btn = doc.querySelector('button');
    expect(btn?.getAttribute('onclick')).toBe(`updateSettings('${identifier}')`);
  });

  it('wraps everything in .settings-wrapper (for CSS and JS hooks)', () => {
    const doc = render();
    expect(doc.querySelector('.settings-wrapper')).not.toBeNull();
  });
});
