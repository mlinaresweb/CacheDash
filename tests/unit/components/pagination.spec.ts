// tests/unit/components/pagination.spec.ts
// --------------------------------------------------
// Tests para generatePaginationComponentHtml (serviceDashboard/Pagination.ts)
// --------------------------------------------------

jest.mock('http', () => jest.requireActual('http'));

// Mock util and capture reference
jest.mock('../../../src/dashboard/utils/paginationHtmlGenerator', () => ({
  generatePagination: jest.fn(),
}));

import { JSDOM } from 'jsdom';
import { generatePaginationComponentHtml } from '../../../src/dashboard/components/serviceDashboard/Pagination';
import { generatePagination } from '../../../src/dashboard/utils/paginationHtmlGenerator';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

type KeyStats = import('../../../src/types/cache').KeyStats;

type Args = {
  service?: string;
  searchKey?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof KeyStats;
  order?: 'asc' | 'desc';
  totalPages?: number;
  htmlFromUtil?: string;
};

function renderHtml(args: Args = {}) {
  const {
    service = 'svcX',
    searchKey = 'foo',
    page = 2,
    limit = 20,
    sortBy = 'hits',
    order = 'desc',
    totalPages = 10,
    htmlFromUtil = '<li class="page-item">MOCK</li>',
  } = args;

  (generatePagination as jest.Mock).mockReturnValue(htmlFromUtil);

  const html = generatePaginationComponentHtml(
    service,
    searchKey,
    page,
    limit,
    sortBy,
    order,
    totalPages,
  );

  return new JSDOM(html).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generatePaginationComponentHtml', () => {
  const defaultArgs: Args = {
    service: 'svcX',
    searchKey: 'bar',
    page: 3,
    limit: 30,
    sortBy: 'size',
    order: 'asc',
    totalPages: 5,
  };

  beforeEach(() => {
    (generatePagination as jest.Mock).mockClear();
  });

  it('wraps the util output in <nav><ul class="pagination">', () => {
    const doc = renderHtml(defaultArgs);
    const nav = doc.querySelector('nav');
    const ul = doc.querySelector('ul.pagination');
    const liText = ul?.querySelector('li')?.textContent;

    expect(nav).toBeTruthy();
    expect(ul).toBeTruthy();
    expect(liText).toBe('MOCK');
  });

  it('calls generatePagination with correct parameters', () => {
    renderHtml(defaultArgs);

    expect(generatePagination).toHaveBeenCalledWith(
      defaultArgs.service,
      defaultArgs.searchKey,
      defaultArgs.page,
      defaultArgs.limit,
      defaultArgs.sortBy,
      defaultArgs.order,
      defaultArgs.totalPages,
    );
  });

  it('renders empty <ul> when generatePagination returns empty string', () => {
    const doc = renderHtml({ ...defaultArgs, totalPages: 0, htmlFromUtil: '' });
    const liCount = doc.querySelectorAll('ul.pagination li').length;
    expect(liCount).toBe(0);
  });
});