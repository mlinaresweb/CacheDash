// tests/unit/components/memoryCard.spec.ts
// --------------------------------------------------
// Tests para generateMemoryCardHtml (mainDashboard/MemoryCard.ts)
// --------------------------------------------------

// JSDOM requiere el módulo http auténtico; anulamos el mock global.
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateMemoryCardHtml } from '../../../src/dashboard/components/mainDashboard/MemoryCard';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const MB = 1024 * 1024;

type MemStats = { size: number; maxMemorySizeMB?: number };

function makeStats(map: Record<string, MemStats>): Map<string, MemStats> {
  return new Map<string, MemStats>(Object.entries(map));
}

function render(stats: Map<string, MemStats>) {
  const html = generateMemoryCardHtml(stats as unknown as Map<string, any>);
  return new JSDOM(html).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generateMemoryCardHtml', () => {
  const statsMap = makeStats({
    greenSvc: { size: 50 * MB, maxMemorySizeMB: 100 }, // 50% → green
    orangeSvc: { size: 70 * MB, maxMemorySizeMB: 100 }, // 70% → orange
    redSvc: { size: 95 * MB, maxMemorySizeMB: 100 }, // 95% → red
    noLimitSvc: { size: 30 * MB }, // NO LIMIT
  });

  it('renders one .card per service with data-service attribute', () => {
    const doc = render(statsMap);
    const cards = doc.querySelectorAll('.card-maindashboard');
    expect(cards.length).toBe(statsMap.size);
    statsMap.forEach((_v, svc) => {
      expect(doc.querySelector(`.card-maindashboard[data-service="${svc}"]`)).toBeTruthy();
    });
  });

  it('computes usage percentage and color correctly for green/orange/red thresholds', () => {
    const doc = render(statsMap);

    const getCard = (svc: string) =>
      doc.querySelector(`.card-maindashboard[data-service="${svc}"]`)!;

    const svcGreen = getCard('greenSvc');
    const svcOrange = getCard('orangeSvc');
    const svcRed = getCard('redSvc');

    expect(svcGreen.querySelector('.percentage')?.textContent).toBe('50.00%');
    expect(svcGreen.querySelector('.circular-loader')?.getAttribute('style')).toContain('--color: #4caf50');

    expect(svcOrange.querySelector('.percentage')?.textContent).toBe('70.00%');
    expect(svcOrange.querySelector('.circular-loader')?.getAttribute('style')).toContain('--color: #ff9800');

    expect(svcRed.querySelector('.percentage')?.textContent).toBe('95.00%');
    expect(svcRed.querySelector('.circular-loader')?.getAttribute('style')).toContain('--color: #f44336');
  });

  it('formats used and max memory text, including "NO LIMIT" when undefined', () => {
    const doc = render(statsMap);

    const noLimitCard = doc.querySelector('[data-service="noLimitSvc"]')!;
    const infoSpans = noLimitCard.querySelectorAll('.memory-info span');

    expect(infoSpans[0].textContent).toBe('Used Memory: 30.00 MB');
    expect(infoSpans[1].textContent).toBe('Max Memory: NO LIMIT');
  });

  it('embeds a WebSocket script pointing to localhost:8081', () => {
    const doc = render(statsMap);
    const script = doc.querySelector('script')?.textContent || '';
    expect(script).toContain("new WebSocket('ws://localhost:8081')");
    expect(script).toContain('updateMemoryCards');
  });
});
