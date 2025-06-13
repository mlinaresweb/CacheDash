// tests/unit/components/summary.spec.ts
// --------------------------------------------------
// Tests para generateSummaryHtml (statistics/Summary.ts)
// --------------------------------------------------

jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateSummaryHtml } from '../../../src/dashboard/components/statistics/Summary';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

function render(args: {
  service?: string;
  hits?: number;
  misses?: number;
  keys?: number;
  sizeBytes?: number;
  avgResp?: number;
  uncachedAvgResp?: number;
} = {}) {
  const {
    service = 'alpha',
    hits = 42,
    misses = 8,
    keys = 20,
    sizeBytes = 102400, // 100 KB
    avgResp = 12.34,
    uncachedAvgResp = 45.67,
  } = args;

  const html = generateSummaryHtml(
    service,
    hits,
    misses,
    keys,
    sizeBytes,
    avgResp,
    uncachedAvgResp,
  );
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/**
 * Helper para extraer los valores de las métricas que aparecen dentro de
 * los <span class="card-title"> generados por el componente.
 */
function getMetricTexts(doc: Document): string[] {
  return Array.from(doc.querySelectorAll('.card-title')).map((el) => el.textContent?.trim() || '');
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generateSummaryHtml', () => {
  it('renders heading with service name and “Summary”', () => {
    const doc = render({ service: 'beta' });
    const h3 = doc.querySelector('h3');
    expect(h3?.textContent?.trim()).toBe('beta - Summary');
  });

  it('displays numeric metrics correctly formatted', () => {
    const doc = render({ hits: 10, misses: 3, keys: 7, sizeBytes: 51200, avgResp: 9.1, uncachedAvgResp: 20 });

    const metricTexts = getMetricTexts(doc);
    expect(metricTexts).toEqual(['10', '3', '7', '50.00 KB', '9.10 ms', '20.00 ms']);
  });

  it('converts bytes to KB with two decimals', () => {
    const doc = render({ sizeBytes: 15360 }); // 15 KB
    const metricTexts = getMetricTexts(doc);
    expect(metricTexts[3]).toBe('15.00 KB');
  });

  it('handles zero values gracefully', () => {
    const doc = render({ hits: 0, misses: 0, keys: 0, sizeBytes: 0, avgResp: 0, uncachedAvgResp: 0 });
    const metricTexts = getMetricTexts(doc);
    expect(metricTexts).toEqual(['0', '0', '0', '0.00 KB', '0.00 ms', '0.00 ms']);
  });
});