// tests/unit/views/mainDashboardView.spec.ts
// --------------------------------------------------
// Tests para generateMainDashboardHtml (views/MainDashboard.ts)
// --------------------------------------------------

// JSDOM necesita el módulo http auténtico.
jest.mock('http', () => jest.requireActual('http'));

// Mock de los 3 sub‑componentes para aislar la vista y verificar inclusión
jest.mock('../../../src/dashboard/components/mainDashboard/MemoryCard', () => ({
  generateMemoryCardHtml: jest.fn(() => '<div id="memCards">MEMORY_CARDS</div>'),
  __esModule: true,
}));

jest.mock('../../../src/dashboard/components/mainDashboard/KeysList', () => ({
  generateKeysListHtml: jest.fn(() => '<table id="keysList">KEYS_LIST</table>'),
  __esModule: true,
}));

jest.mock('../../../src/dashboard/components/mainDashboard/Chart', () => ({
  generateChartHtml: jest.fn(() => '<canvas id="chartStub"></canvas>'),
  __esModule: true,
}));

import { JSDOM } from 'jsdom';
import { generateMainDashboardHtml } from '../../../src/dashboard/views/pages/MainDashboard';
import { generateMemoryCardHtml } from '../../../src/dashboard/components/mainDashboard/MemoryCard';
import { generateKeysListHtml } from '../../../src/dashboard/components/mainDashboard/KeysList';
import { generateChartHtml } from '../../../src/dashboard/components/mainDashboard/Chart';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function render() {
  const html = generateMainDashboardHtml(new Map(), new Map());
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('views › generateMainDashboardHtml', () => {
  it('invokes sub‑component generators once', () => {
    render();
    expect(generateMemoryCardHtml).toHaveBeenCalledTimes(1);
    expect(generateKeysListHtml).toHaveBeenCalledTimes(1);
    expect(generateChartHtml).toHaveBeenCalledTimes(1);
  });

  it('contains heading, wrapper containers and injected HTML of sub‑components', () => {
    const doc = render();

    expect(doc.querySelector('h1')?.textContent).toMatch(/Main\s+Dashboard/i);

    // Memory cards container
    expect(doc.querySelector('#memCards')).toBeTruthy();

    // Chart inside chart‑container‑maindashboard
    const chartContainer = doc.querySelector('.chart-container-maindashboard');
    expect(chartContainer?.querySelector('#chartStub')).toBeTruthy();

    // Keys list present inside .tables-container
    const tablesContainer = doc.querySelector('.tables-container');
    expect(tablesContainer?.querySelector('#keysList')).toBeTruthy();
  });
});
