// tests/unit/views/statisticsView.spec.ts
// --------------------------------------------------
// Tests para generateStatisticsViewHtml (views/StatisticsView.ts)
// --------------------------------------------------

// JSDOM necesita http real
jest.mock('http', () => jest.requireActual('http'));

// Mocks de sub‑componentes
jest.mock('../../../src/dashboard/components/statistics/Summary', () => ({
  generateSummaryHtml: jest.fn(() => '<section id="summaryStub"></section>'),
  __esModule: true,
}));

jest.mock('../../../src/dashboard/components/statistics/Ratios', () => ({
  generateRatiosHtml: jest.fn(() => '<section id="ratiosStub"></section>'),
  __esModule: true,
}));

jest.mock('../../../src/dashboard/components/statistics/Charts', () => ({
  generateChartsHtml: jest.fn(() => '<div id="chartsStub"></div>'),
  __esModule: true,
}));

import { JSDOM } from 'jsdom';
import { generateStatisticsViewHtml } from '../../../src/dashboard/views/pages/StatisticsView';
import { generateSummaryHtml } from '../../../src/dashboard/components/statistics/Summary';
import { generateRatiosHtml } from '../../../src/dashboard/components/statistics/Ratios';
import { generateChartsHtml } from '../../../src/dashboard/components/statistics/Charts';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

const baseArgs = {
  service: 'svcA',
  labelsHM: ['k1', 'k2'],
  hits: [5, 3],
  misses: [1, 2],
  labelsSizes: ['k1', 'k2'],
  sizes: [128, 256],
  totalHits: 8,
  totalMisses: 3,
  totalKeys: 10,
  totalSize: 102400,
  avgResp: 12.3,
  uncachedAvg: 45.6,
  keyRT: [20, 30],
  keyLabels: ['k1', 'k2'],
  uncachedRT: [25, 35],
  uncachedLabels: ['k1', 'k2'],
  added: 4,
  deleted: 2,
  evictions: 1,
};

function render() {
  const html = generateStatisticsViewHtml(
    baseArgs.service,
    baseArgs.labelsHM,
    baseArgs.hits,
    baseArgs.misses,
    baseArgs.labelsSizes,
    baseArgs.sizes,
    baseArgs.totalHits,
    baseArgs.totalMisses,
    baseArgs.totalKeys,
    baseArgs.totalSize,
    baseArgs.avgResp,
    baseArgs.uncachedAvg,
    baseArgs.keyRT,
    baseArgs.keyLabels,
    baseArgs.uncachedRT,
    baseArgs.uncachedLabels,
    baseArgs.added,
    baseArgs.deleted,
    baseArgs.evictions,
  );
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('views › generateStatisticsViewHtml', () => {
  it('calls sub‑component generators once with correct first arg', () => {
    render();
    expect(generateSummaryHtml).toHaveBeenCalledWith(
      baseArgs.service,
      baseArgs.totalHits,
      baseArgs.totalMisses,
      baseArgs.totalKeys,
      baseArgs.totalSize,
      baseArgs.avgResp,
      baseArgs.uncachedAvg,
    );
    expect(generateRatiosHtml).toHaveBeenCalledWith(
      baseArgs.service,
      baseArgs.totalHits,
      baseArgs.totalMisses,
      baseArgs.added,
      baseArgs.deleted,
      baseArgs.totalKeys,
      baseArgs.evictions,
    );
    expect(generateChartsHtml).toHaveBeenCalledTimes(1);
  });

  it('injects summary, ratios and charts stubs in output', () => {
    const doc = render();
    expect(doc.getElementById('summaryStub')).toBeTruthy();
    expect(doc.getElementById('ratiosStub')).toBeTruthy();
    expect(doc.getElementById('chartsStub')).toBeTruthy();
  });

  it('contains back button linking to cache-key-stats of service', () => {
    const doc = render();
    const back = doc.querySelector('a.btn.btn-secondary') as HTMLAnchorElement;
    expect(back.href).toMatch(/\/cache-key-stats\?service=svcA$/);
  });

  it('script includes WebSocket and updateStatistics()', () => {
    const doc = render();
    const script = doc.querySelector('script')?.textContent || '';
    expect(script).toContain("new WebSocket('ws://localhost:8081')");
    expect(script).toContain('updateStatistics');
    expect(script).toContain('updateCharts');
  });
});
