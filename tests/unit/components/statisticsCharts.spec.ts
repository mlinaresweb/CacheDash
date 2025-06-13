// tests/unit/components/statisticsCharts.spec.ts
// --------------------------------------------------
// Tests para generateChartsHtml (statistics/Charts.ts)
// --------------------------------------------------

jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateChartsHtml } from '../../../src/dashboard/components/statistics/Charts';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

const sampleLabels = ['svcA/key1', 'svcB/key2'];
const sampleHits = [10, 5];
const sampleMisses = [2, 1];
const sampleSizes = [128, 64];
const avgRespTime = 15;
const keyRespTimes = [20, 30];
const keyRespLabels = ['svcA/key1', 'svcB/key2'];
const uncachedTimes = [25, 35];
const uncachedLabels = ['svcA/key1', 'svcB/key2'];

function render() {
  const html = generateChartsHtml(
    sampleLabels,
    sampleHits,
    sampleMisses,
    sampleSizes,
    avgRespTime,
    keyRespTimes,
    keyRespLabels,
    uncachedTimes,
    uncachedLabels,
  );
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generateChartsHtml', () => {
  it('renders wrapper with 4 canvas elements and expected ids', () => {
    const doc = render();
    const ids = [
      'cacheStatsChartHitsMisses',
      'cacheStatsChartSizes',
      'responseTimeChart',
      'uncachedResponseTimeChart',
    ];
    ids.forEach((id) => {
      expect(doc.getElementById(id)).toBeTruthy();
    });
  });

  it('script contains renderChart invocation and new Chart instances', () => {
    const doc = render();
    const script = doc.querySelector('script')?.textContent || '';

    expect(script).toContain('renderChart(');
    expect(script).toContain('new Chart(');
    expect(script).toContain(JSON.stringify(sampleHits));
    expect(script).toContain(JSON.stringify(sampleSizes));
  });

  it('simplifies label paths in JavaScript (contains .split("/"))', () => {
    const doc = render();
    const script = doc.querySelector('script')?.textContent || '';
    expect(script).toContain("label.split('/')");
  });
});
