// tests/unit/views/keyStatsView.spec.ts
// --------------------------------------------------
// Tests para generateKeyStatsViewHtml (views/KeyStatsView.ts)
// --------------------------------------------------

// JSDOM requiere http real; anulamos mock global de setup.
jest.mock('http', () => jest.requireActual('http'));

// Mocks de sub‑componentes para aislar la vista
jest.mock('../../../src/dashboard/components/serviceDashboard/Filters', () => ({
  generateFiltersHtml: jest.fn(() => '<form id="filtersStub"></form>'),
  __esModule: true,
}));

jest.mock('../../../src/dashboard/components/serviceDashboard/KeysTable', () => ({
  generateKeysTableHtml: jest.fn(() => '<div id="keysTableStub"></div>'),
  __esModule: true,
}));

jest.mock('../../../src/dashboard/components/serviceDashboard/Pagination', () => ({
  generatePaginationComponentHtml: jest.fn(() => '<ul id="paginationStub"></ul>'),
  __esModule: true,
}));

import { JSDOM } from 'jsdom';
import { generateKeyStatsViewHtml } from '../../../src/dashboard/views/pages/KeyStatsView';
import { generateFiltersHtml } from '../../../src/dashboard/components/serviceDashboard/Filters';
import { generateKeysTableHtml } from '../../../src/dashboard/components/serviceDashboard/KeysTable';
import { generatePaginationComponentHtml } from '../../../src/dashboard/components/serviceDashboard/Pagination';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

function render() {
  const html = generateKeyStatsViewHtml('svcA', [], 0);
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('views › generateKeyStatsViewHtml', () => {
  it('calls sub‑components with expected arguments', () => {
    render();
    expect(generateFiltersHtml).toHaveBeenCalledWith('svcA', undefined, 'keyName', 'asc');
    expect(generateKeysTableHtml).toHaveBeenCalled();
    expect(generatePaginationComponentHtml).toHaveBeenCalled();
  });

  it('renders heading with service name and action buttons', () => {
    const doc = render();
    const h1 = doc.querySelector('h1');
    expect(h1?.textContent).toMatch(/svcA.*Dashboard/i);

    const backBtn = doc.querySelector('a.btn.btn-secondary');
    expect(backBtn?.getAttribute('href')).toBe('/cache-key-stats');

    const flushBtn = doc.querySelector('button.btn.btn-danger');
    expect(flushBtn?.textContent).toMatch(/Flush Cache/);
  });

  it('injects stub HTML of filters, table and pagination', () => {
    const doc = render();
    expect(doc.getElementById('filtersStub')).toBeTruthy();
    expect(doc.getElementById('keysTableStub')).toBeTruthy();
    expect(doc.getElementById('paginationStub')).toBeTruthy();
  });

  it('script includes WebSocket connection and updateDashboard()', () => {
    const doc = render();
    const script = doc.querySelector('script')?.textContent || '';
    expect(script).toContain("new WebSocket('ws://localhost:8081')");
    expect(script).toContain('updateDashboard');
  });
});
