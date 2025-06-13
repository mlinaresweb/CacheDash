// tests/unit/views/logsView.spec.ts
// --------------------------------------------------
// Tests para generateLogsHtml (views/LogsView.ts)
// --------------------------------------------------

// JSDOM requiere http real
jest.mock('http', () => jest.requireActual('http'));

// Mock de sub‑componentes
jest.mock('../../../src/dashboard/components/logs/Filters', () => ({
  generateFiltersHtml: jest.fn(() => '<form id="filtersStub"></form>'),
  __esModule: true,
}));

jest.mock('../../../src/dashboard/components/logs/LogsTable', () => ({
  generateLogsTableHtml: jest.fn((_: any, forTableOnly: boolean) => forTableOnly ? '<tbody><tr id="rowStub"></tr></tbody>' : '<table id="tableStub"></table>'),
  __esModule: true,
}));

import { JSDOM } from 'jsdom';
import { generateLogsHtml } from '../../../src/dashboard/views/pages/LogsView';
import { generateFiltersHtml } from '../../../src/dashboard/components/logs/Filters';
import { generateLogsTableHtml } from '../../../src/dashboard/components/logs/LogsTable';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const fakeLogs = [
  { service: 'svcA', message: 'hit key', timestamp: new Date() },
];

function renderFull() {
  const html = generateLogsHtml(fakeLogs, ['svcA', 'svcB'], true);
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

function renderRowsOnly() {
  return generateLogsHtml(fakeLogs, [], false, undefined, true);
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('views › generateLogsHtml', () => {
  it('calls generateLogsTableHtml and Filters with correct flags', () => {
    renderFull();
    expect(generateLogsTableHtml).toHaveBeenCalledWith(fakeLogs, false);
    expect(generateFiltersHtml).toHaveBeenCalledWith(['svcA', 'svcB'], true, undefined);
  });

  it('forTableOnly=true returns only table rows HTML', () => {
    const fragment = renderRowsOnly();
    expect(fragment).toContain('<tbody>');
    expect(fragment).not.toContain('<html>');
  });

  it('in full mode injects filters and table stubs', () => {
    const doc = renderFull();
    expect(doc.getElementById('filtersStub')).toBeTruthy();
    expect(doc.getElementById('tableStub')).toBeTruthy();
  });

  it('script contains WebSocket connection and applyFilters()', () => {
    const doc = renderFull();
    const script = doc.querySelector('script')?.textContent || '';
    expect(script).toContain("new WebSocket('ws://localhost:8081')");
    expect(script).toContain('applyFilters');
  });
});
