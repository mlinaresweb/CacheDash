// tests/unit/components/chart.spec.ts
// --------------------------------------------------
// Tests para generateChartHtml (mainDashboard/Chart.ts)
// --------------------------------------------------

// JSDOM necesita un http real; anulamos el mock global del setup.
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateChartHtml } from '../../../src/dashboard/components/mainDashboard/Chart';

/* -------------------------------------------------------------------------- */
/* Helper                                                                      */
/* -------------------------------------------------------------------------- */

function render() {
  const html = generateChartHtml();
  return new JSDOM(html).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                       */
/* -------------------------------------------------------------------------- */

describe('components › generateChartHtml', () => {
  it('contains an <h2> heading with the expected title', () => {
    const doc = render();
    const h2 = doc.querySelector('h2');
    expect(h2?.textContent).toMatch(/Cache Calls Over Time for All Services/);
  });

  it('contains a <canvas> element with the expected id', () => {
    const doc = render();
    const canvas = doc.querySelector('canvas#allServicesCacheCallsChart');
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute('id')).toBe('allServicesCacheCallsChart');
  });

  it('embeds a <script> tag that fetches call history and initializes Chart.js', () => {
    const doc = render();
    const script = doc.querySelector('script');
    const js = script?.textContent ?? '';

    expect(js).toContain("fetch('/all-services-call-history')");
    expect(js).toContain('new Chart(');
    expect(js).toContain('WebSocket(');
  });

  it('uses a WebSocket endpoint pointing to localhost:8081', () => {
    const doc = render();
    const js = doc.querySelector('script')?.textContent ?? '';
    expect(js).toContain("new WebSocket('ws://localhost:8081')");
  });
});
