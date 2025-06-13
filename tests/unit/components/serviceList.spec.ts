// tests/unit/components/serviceList.spec.ts
// --------------------------------------------------
// Tests para generateServiceListComponentHtml (serviceList/ServiceList.ts)
// --------------------------------------------------

// Necesitamos el módulo http real para JSDOM.
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateServiceListComponentHtml } from '../../../src/dashboard/components/serviceList/ServiceList';

import type { CacheStats } from '../../../src/types/cache';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function makeStats(opts: Partial<CacheStats>): CacheStats {
  // Provide sensible defaults for any missing props.
  return {
    hits: 0,
    misses: 0,
    keys: 0,
    size: 0,
    maxMemorySizeMB: undefined,
    ...opts,
  } as CacheStats;
}

function render(map: Map<string, CacheStats>) {
  const html = generateServiceListComponentHtml(map);
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generateServiceListComponentHtml', () => {
  const sampleMap = new Map<string, CacheStats>([
    [
      'alpha',
      makeStats({ hits: 5, misses: 1, keys: 10, size: 204800 /* 200 KB */ }),
    ],
    [
      'beta',
      makeStats({ hits: 2, misses: 3, keys: 4, size: 51200 /* 50 KB */ }),
    ],
  ]);

  it('renders a card per service with correct metrics', () => {
    const doc = render(sampleMap);
    const cards = doc.querySelectorAll('.service-card');
    expect(cards.length).toBe(sampleMap.size);

    // Alpha card assertions
    const alphaCard = Array.from(cards).find((c) =>
      c.querySelector('h5')?.textContent?.includes('alpha'),
    )!;

    const alphaText = alphaCard.textContent || '';
    expect(alphaText).toMatch(/Hits:\s*5/);
    expect(alphaText).toMatch(/Misses:\s*1/);
    expect(alphaText).toMatch(/Keys:\s*10/);
    expect(alphaText).toMatch(/Size:\s*200\.00\s*KB/);
  });

  it('converts size bytes → KB with two decimal places', () => {
    const doc = render(sampleMap);
    const betaCard = Array.from(doc.querySelectorAll('.service-card')).find((c) =>
      c.querySelector('h5')?.textContent?.includes('beta'),
    )!;
    expect(betaCard.textContent).toMatch(/Size:\s*50\.00\s*KB/);
  });

  it('details link points to /cache-key-stats?service=...', () => {
    const doc = render(sampleMap);
    const link = doc.querySelector('a.btn.btn-primary') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.href).toMatch(/\/cache-key-stats\?service=/);
  });

  it('returns empty string when map is empty', () => {
    const html = generateServiceListComponentHtml(new Map());
    expect(html.trim()).toBe('');
  });
});
