// tests/unit/components/keysList.spec.ts
// --------------------------------------------------
// Tests para generateKeysListHtml (mainDashboard/KeysList.ts)
// --------------------------------------------------

// JSDOM requiere http real; anulamos el mock global.
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateKeysListHtml } from '../../../src/dashboard/components/mainDashboard/KeysList';

import type { KeyStats } from '../../../src/types/cache';

/* -------------------------------------------------------------------------- */
/* Helper: crea un Map<string, Map<string, KeyStats>>                         */
/* -------------------------------------------------------------------------- */

function makeRegistry(entries: { service: string; keyName: string; size: number; hits?: number; misses?: number }[]) {
  const outer = new Map<string, Map<string, KeyStats>>();

  entries.forEach(({ service, keyName, size, hits = 0, misses = 0 }) => {
    const inner = outer.get(service) ?? new Map<string, KeyStats>();
    inner.set(keyName, {
      keyName,
      size,
      hits,
      misses,
      setTime: Date.now() - 1000, // 1s ago
      endTime: Date.now() + 1000,
      ttl: 2,
    } as unknown as KeyStats);
    if (!outer.has(service)) outer.set(service, inner);
  });
  return outer;
}

function render(registry: Map<string, Map<string, KeyStats>>) {
  const html = generateKeysListHtml(registry);
  return new JSDOM(html).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generateKeysListHtml', () => {
  it('sorts rows by size descending by default', () => {
    const registry = makeRegistry([
      { service: 'svcA', keyName: 'foo/key1', size: 50 },
      { service: 'svcB', keyName: 'bar/key2', size: 100 },
    ]);

    const doc = render(registry);
    const firstRowCells = doc.querySelector('tbody tr')?.querySelectorAll('td');
    expect(firstRowCells?.[0].textContent).toBe('key2'); // simplified key for key2
    expect(firstRowCells?.[8].textContent).toBe('100'); // size column
  });

  it('simplifies key name to last segment', () => {
    const registry = makeRegistry([{ service: 'svc', keyName: 'a/b/c/keyX', size: 1 }]);
    const doc = render(registry);
    const keyCell = doc.querySelector('tbody tr td');
    expect(keyCell?.textContent).toBe('keyX');
    expect(keyCell?.getAttribute('title')).toBe('a/b/c/keyX');
  });

  it('renders action buttons with correct onclick service and key', () => {
    const registry = makeRegistry([{ service: 'svcY', keyName: 'plainKey', size: 5 }]);
    const doc = render(registry);
    const btns = doc.querySelectorAll('tbody tr td.actions button');
    expect(btns.length).toBe(3);
    btns.forEach((btn) => {
      const onclick = btn.getAttribute('onclick') || '';
      expect(onclick).toContain("'svcY'");
      expect(onclick).toContain("'plainKey'");
    });
  });

  it('shows empty tbody when registry is empty', () => {
    const doc = render(new Map());
    expect(doc.querySelectorAll('tbody tr').length).toBe(0);
  });

  it('includes sort and search UI elements', () => {
    const doc = render(makeRegistry([]));
    expect(doc.querySelector('#sort-by')).toBeTruthy();
    expect(doc.querySelector('#search-key')).toBeTruthy();
  });
});
