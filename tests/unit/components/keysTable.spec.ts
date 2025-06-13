// tests/unit/components/keysTable.spec.ts
// --------------------------------------------------
// Tests para generateKeysTableHtml (serviceDashboard/KeysTable.ts)
// --------------------------------------------------

// Anulamos el mock global de http para JSDOM.
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateKeysTableHtml } from '../../../src/dashboard/components/serviceDashboard/KeysTable';
import type { KeyStats } from '../../../src/types/cache';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

const FIXED_NOW = new Date('2025-01-01T12:00:00Z').getTime();

beforeAll(() => {
  jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
});

afterAll(() => {
  (Date.now as jest.Mock).mockRestore();
});

function render(service: string, keyStats: KeyStats[]) {
  const html = generateKeysTableHtml(service, keyStats);
  return new JSDOM(html).window.document;
}

function makeStat({
  keyName,
  hits = 0,
  misses = 0,
  size = 128,
  ttl = 3600,
  setOffsetSec = 0,
}: {
  keyName: string;
  hits?: number;
  misses?: number;
  size?: number;
  ttl?: number;
  setOffsetSec?: number;
}): KeyStats {
  const setTime = FIXED_NOW - setOffsetSec * 1000;
  return {
    keyName,
    hits,
    misses,
    ttl,
    size,
    setTime,
    endTime: setTime + ttl * 1000,
  } as unknown as KeyStats;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generateKeysTableHtml', () => {
  it('renders one row per keyStat with correct cell values', () => {
    const stats = [
      makeStat({ keyName: 'foo', hits: 5, misses: 2, size: 64 }),
      makeStat({ keyName: 'bar', hits: 3, misses: 1, size: 32 }),
    ];
    const doc = render('svcA', stats);
    const rows = doc.querySelectorAll('tbody tr');
    expect(rows.length).toBe(stats.length);

    const firstCells = rows[0].querySelectorAll('td');
    expect(firstCells[0].textContent).toBe('foo');
    expect(firstCells[1].textContent).toBe('5');
    expect(firstCells[2].textContent).toBe('2');
    expect(firstCells[7].textContent).toBe('64');
  });

  it('computes timeRemaining based on Date.now()', () => {
    const stat = makeStat({ keyName: 'ttl-key', ttl: 120, setOffsetSec: 30 }); // started 30s ago
    const doc = render('svcB', [stat]);
    const timeRemainingCell = doc.querySelector('tbody tr td:nth-child(7)');
    expect(timeRemainingCell?.textContent).toBe('90'); // 120 - 30
  });

  it('buttons have correct onclick with service and key', () => {
    const stat = makeStat({ keyName: 'btnKey' });
    const doc = render('myService', [stat]);
    const buttons = doc.querySelectorAll('tbody tr td.actions button');
    expect(buttons.length).toBe(3);
    buttons.forEach((btn) => {
      const onclick = btn.getAttribute('onclick') || '';
      expect(onclick).toContain("'myService'");
      expect(onclick).toContain("'btnKey'");
    });
  });

  it('renders tbody empty when keyStats array is empty', () => {
    const doc = render('svc', []);
    expect(doc.querySelectorAll('tbody tr').length).toBe(0);
  });
});
