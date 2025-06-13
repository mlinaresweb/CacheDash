// tests/unit/components/generateMemoryUsageHtml.spec.ts

jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateMemoryUsageHtml } from '../../../src/dashboard/components/generateMemoryUsageHtml';

import type { CacheStats } from '../../../src/types/cache';

function renderMemory(map: Map<string, Partial<CacheStats>>) {
  const html = generateMemoryUsageHtml(map as Map<string, CacheStats>);
  return new JSDOM(html).window.document;
}

describe('components › generateMemoryUsageHtml', () => {
  it('renders a row per service with memory values', () => {
    const statsMap = new Map<string, Partial<CacheStats>>([
      ['svcA', { maxMemorySizeMB: 128 }],
      ['svcB', { maxMemorySizeMB: 256 }],
    ]);

    const doc = renderMemory(statsMap);
    const rows = Array.from(doc.querySelectorAll('table tr'));
    expect(rows.length).toBe(1 + statsMap.size); // header + services

    const firstDataRowCells = rows[1].querySelectorAll('td');
    expect(firstDataRowCells[0].textContent).toBe('svcA');
    expect(firstDataRowCells[1].textContent).toMatch(/128/);
  });

  it('prints "No limit" when maxMemorySizeMB is undefined', () => {
    const statsMap = new Map<string, Partial<CacheStats>>([
      ['svcC', {}],
    ]);
    const doc = renderMemory(statsMap);
    const cell = doc.querySelector('table tr:nth-child(2) td:nth-child(2)')?.textContent;
    expect(cell).toBe('No limit');
  });

  it('renders only the header row when the registry is empty', () => {
    const doc = renderMemory(new Map());
    const rows = doc.querySelectorAll('table tr');
    expect(rows.length).toBe(1);
  });
});
