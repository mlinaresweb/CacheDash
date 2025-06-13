// tests/unit/components/logsTable.spec.ts
// --------------------------------------------------
// Tests para generateLogsTableHtml (logs/LogsTable.ts)
// --------------------------------------------------

// Recuperamos el módulo real `http` que JSDOM necesita, anulando el mock global.
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateLogsTableHtml } from '../../../src/dashboard/components/logs/LogsTable';

interface LogEntry {
  service: string;
  message: string;
  timestamp: Date;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const makeLogs = (n: number): LogEntry[] =>
  Array.from({ length: n }, (_, i) => ({
    service: `svc-${i}`,
    message: `msg-${i}`,
    timestamp: new Date(`2025-01-01T0${i}:00:00Z`),
  }));

const renderFull = (logs: LogEntry[]) =>
  new JSDOM(generateLogsTableHtml(logs)).window.document;

const renderRows = (logs: LogEntry[]) =>
  JSDOM.fragment(generateLogsTableHtml(logs, true));

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generateLogsTableHtml', () => {
  it('renders table header and wrapper when forTableOnly = false', () => {
    const doc = renderFull([]);

    const wrapper = doc.querySelector('div.table-container');
    const table = doc.querySelector('table#logsTable');
    const headers = Array.from(doc.querySelectorAll('thead th')).map((th) => th.textContent?.trim());

    expect(wrapper).toBeTruthy();
    expect(table).toBeTruthy();
    expect(headers).toEqual(['Timestamp', 'Service', 'Message']);
  });

  it('renders a <tr> per log entry in tbody', () => {
    const logs = makeLogs(3);
    const doc = renderFull(logs);
    const rows = doc.querySelectorAll('tbody tr');
    expect(rows.length).toBe(logs.length);
  });

  it('embeds ISO timestamp in data-timestamp attribute and shows service + message', () => {
    const logs = makeLogs(1);
    const doc = renderFull(logs);
    const row = doc.querySelector('tbody tr')!;
    const cells = row.querySelectorAll('td');

    expect(cells[0].getAttribute('data-timestamp')).toBe(logs[0].timestamp.toISOString());
    expect(cells[1].textContent).toBe(logs[0].service);
    expect(cells[2].textContent).toBe(logs[0].message);
  });

  it('when forTableOnly = true returns only rows (no <table>)', () => {
    const fragment = renderRows(makeLogs(2));
    // there should be trs but no table tag
    expect(fragment.querySelectorAll('tr').length).toBe(2);
    expect(fragment.querySelector('table')).toBeNull();
  });

  it('handles empty array: tbody has 0 rows, fragment returns ""', () => {
    const doc = renderFull([]);
    expect(doc.querySelectorAll('tbody tr').length).toBe(0);

    const fragment = renderRows([]);
    expect(fragment.textContent).toBe('');
  });
});
