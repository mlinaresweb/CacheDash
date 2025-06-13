// tests/unit/components/ratios.spec.ts
// --------------------------------------------------
// Tests para generateRatiosHtml (statistics/Ratios.ts)
// --------------------------------------------------

// Necesario para JSDOM
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateRatiosHtml } from '../../../src/dashboard/components/statistics/Ratios';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

function render(args: {
  hits?: number;
  misses?: number;
  added?: number;
  deleted?: number;
  keys?: number;
  evictions?: number;
} = {}) {
  const {
    hits = 80,
    misses = 20,
    added = 40,
    deleted = 10,
    keys = 100,
    evictions = 5,
  } = args;
  const html = generateRatiosHtml('svcA', hits, misses, added, deleted, keys, evictions);
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generateRatiosHtml', () => {
  it('calculates hit and miss ratio percentages correctly', () => {
    const doc = render({ hits: 75, misses: 25 });
    const hitSpan = doc.querySelectorAll('.percentage')[0];
    const missSpan = doc.querySelectorAll('.percentage')[1];
    expect(hitSpan?.textContent).toBe('75.00%');
    expect(missSpan?.textContent).toBe('25.00%');
  });

  it('calculates cache renewal and eviction rates', () => {
    // hits/misses not relevant here
    const doc = render({ added: 10, deleted: 20, keys: 70, evictions: 7 });
    const renewalSpan = doc.querySelectorAll('.percentage')[2];
    const evictionSpan = doc.querySelectorAll('.percentage')[3];
    // (10+20)/(70+10+20)=30/100=30%
    expect(renewalSpan?.textContent).toBe('30.00%');
    // 7/(70+7)=7/77≈9.09%
    expect(evictionSpan?.textContent).toBe('9.09%');
  });

  it('uses correct colors for each metric circular-loader', () => {
    const doc = render();
    const loaders = doc.querySelectorAll('.circular-loader');
    expect(loaders[0].getAttribute('style')).toContain('--color: green');
    expect(loaders[1].getAttribute('style')).toContain('--color: #dc3545');
    expect(loaders[2].getAttribute('style')).toContain('--color: orange');
    expect(loaders[3].getAttribute('style')).toContain('--color: #2381f5');
  });

  it('handles zero denominators (division by zero) returning 0%', () => {
    const doc = render({ hits: 0, misses: 0, keys: 0 });
    const percentages = Array.from(doc.querySelectorAll('.percentage')).map((sp) => sp.textContent);
    expect(percentages).toEqual(['0.00%', '0.00%', '0.00%', '0.00%']);
  });
});
