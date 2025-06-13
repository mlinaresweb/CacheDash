// tests/unit/utils/paginationUtil.spec.ts
// --------------------------------------------------
// Tests para generatePagination (utils/paginationHtmlGenerator.ts)
// --------------------------------------------------

jest.mock('http', () => jest.requireActual('http'));

import { generatePagination } from '../../src/dashboard/utils/paginationHtmlGenerator';
import { JSDOM } from 'jsdom';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

function getLiTexts(html: string): string[] {
  const doc = new JSDOM(`<ul>${html}</ul>`).window.document;
  return Array.from(doc.querySelectorAll('li.page-item')).map((li) => li.textContent?.trim() || '');
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('utils › generatePagination', () => {
  const baseArgs = {
    service: 'svcA',
    searchKey: 'user',
    page: 2,
    limit: 10,
    sortBy: 'hits' as const,
    order: 'asc' as const,
  };

  it('creates one <li> per total page with correct numbers', () => {
    const html = generatePagination(
      baseArgs.service,
      baseArgs.searchKey,
      baseArgs.page,
      baseArgs.limit,
      baseArgs.sortBy,
      baseArgs.order,
      5,
    );
    const liTexts = getLiTexts(html);
    expect(liTexts).toEqual(['1', '2', '3', '4', '5']);
  });

  it('adds class "active" to current page', () => {
    const html = generatePagination(
      baseArgs.service,
      baseArgs.searchKey,
      3,
      baseArgs.limit,
      baseArgs.sortBy,
      baseArgs.order,
      5,
    );
    const doc = new JSDOM(`<ul>${html}</ul>`).window.document;
    const activeLi = doc.querySelector('li.active');
    expect(activeLi?.textContent?.trim()).toBe('3');
  });

  it('builds href with correct query parameters', () => {
    const html = generatePagination(
      'svcB',
      undefined,
      1,
      15,
      'size',
      'desc',
      1,
    );
    const doc = new JSDOM(`<ul>${html}</ul>`).window.document;
    const link = doc.querySelector('a.page-link') as HTMLAnchorElement;
    expect(link.href).toContain('service=svcB');
    expect(link.href).toContain('searchKey='); // empty
    expect(link.href).toContain('sortBy=size');
    expect(link.href).toContain('order=desc');
    expect(link.href).toContain('page=1');
    expect(link.href).toContain('limit=15');
  });

  it('returns empty string when totalPages is 0', () => {
    const html = generatePagination(
      baseArgs.service,
      baseArgs.searchKey,
      1,
      baseArgs.limit,
      baseArgs.sortBy,
      baseArgs.order,
      0,
    );
    expect(html.trim()).toBe('');
  });
});
