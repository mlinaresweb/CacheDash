// tests/unit/views/statisticsGlobalView.spec.ts
// --------------------------------------------------
// Tests para generateStatisticsGlobalViewHtml (views/StatisticsGlobalView.ts)
// --------------------------------------------------

// Hace falta el módulo http real para JSDOM
jest.mock('http', () => jest.requireActual('http'));

// Mocks de sub‑componentes
jest.mock('../../../src/dashboard/components/statistics/Summary', () => ({
  generateSummaryHtml: jest.fn(() => '<section id="summaryStubG"></section>'),
  __esModule: true,
}));

jest.mock('../../../src/dashboard/components/statistics/Ratios', () => ({
  generateRatiosHtml: jest.fn(() => '<section id="ratiosStubG"></section>'),
  __esModule: true,
}));

jest.mock('../../../src/dashboard/components/statistics/Charts', () => ({
  generateChartsHtml: jest.fn(() => '<div id="chartsStubG"></div>'),
  __esModule: true,
}));

import { JSDOM } from 'jsdom';
import { generateStatisticsGlobalViewHtml } from '../../../src/dashboard/views/pages/StatisticsGlobalView';
import { generateSummaryHtml } from '../../../src/dashboard/components/statistics/Summary';
import { generateRatiosHtml } from '../../../src/dashboard/components/statistics/Ratios';
import { generateChartsHtml } from '../../../src/dashboard/components/statistics/Charts';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

const baseArgs = {
  service: 'All',
  labels: ['svcA', 'svcB'],
  hits: [10, 5],
  misses: [2, 1],
  sizes: [128, 64],
  totalHits: 15,
  totalMisses: 3,
  totalKeys: 20,
  totalSize: 256000,
  avgResp: 11.1,
  uncachedAvg: 33.3,
  keyRT: [22, 44],
  keyLabels: ['k1', 'k2'],
  uncachedRT: [30, 50],
  uncachedLabels: ['k1', 'k2'],
  added: 4,
  deleted: 2,
  evictions: 1,
};

function render() {
  const html = generateStatisticsGlobalViewHtml(
    baseArgs.service,
    baseArgs.labels,
    baseArgs.hits,
    baseArgs.misses,
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

describe('views › generateStatisticsGlobalViewHtml', () => {
  it('calls generators Summary, Ratios, Charts once', () => {
    render();
    expect(generateSummaryHtml).toHaveBeenCalledTimes(1);
    expect(generateRatiosHtml).toHaveBeenCalledTimes(1);
    expect(generateChartsHtml).toHaveBeenCalledTimes(1);
  });

  it('injects stub sections into output', () => {
    const doc = render();
    expect(doc.getElementById('summaryStubG')).toBeTruthy();
    expect(doc.getElementById('ratiosStubG')).toBeTruthy();
    expect(doc.getElementById('chartsStubG')).toBeTruthy();
  });

  it('has back button to /dashboard', () => {
    const doc = render();
    const back = doc.querySelector('a.btn.btn-secondary') as HTMLAnchorElement;
    expect(back.href).toMatch(/\/dashboard$/);
  });

  it('script includes ws connect and updateStatistics()', () => {
    const doc = render();
    const script = doc.querySelector('script')?.textContent || '';
    expect(script).toContain("new WebSocket('ws://localhost:8081')");
    expect(script).toContain('UPDATE_GLOBAL_STATISTICS');
    expect(script).toContain('updateStatistics');
  });
});
