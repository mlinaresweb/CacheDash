// tests/unit/components/serviceFilters.spec.ts
// --------------------------------------------------
// Tests para generateFiltersHtml (serviceDashboard/Filters.ts)
// --------------------------------------------------

// JSDOM necesita el módulo http real; anulamos el mock global que lo sustituye.
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateFiltersHtml } from '../../../src/dashboard/components/serviceDashboard/Filters';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

function render({
  service = 'svcA',
  searchKey,
  sortBy,
  order,
}: {
  service?: string;
  searchKey?: string;
  sortBy?: keyof import('../../../src/types/cache').KeyStats;
  order?: 'asc' | 'desc';
} = {}) {
  const html = generateFiltersHtml(service, searchKey, sortBy, order);
  return new JSDOM(html).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › serviceDashboard/generateFiltersHtml', () => {
  it('sets hidden service input value correctly', () => {
    const doc = render({ service: 'my-svc' });
    const hidden = doc.querySelector('input[type="hidden"][name="service"]') as HTMLInputElement;
    expect(hidden.value).toBe('my-svc');
  });

  it('injects searchKey into the text input', () => {
    const doc = render({ searchKey: 'user:42' });
    const input = doc.querySelector('#searchKey') as HTMLInputElement;
    expect(input.value).toBe('user:42');
  });

  it('marks selected option in sortBy select', () => {
    const doc = render({ sortBy: 'hits' });
    const select = doc.querySelector('#sortBy') as HTMLSelectElement;
    expect(select.value).toBe('hits');
  });

  it('marks selected option in order select', () => {
    const doc = render({ order: 'desc' });
    const select = doc.querySelector('#order') as HTMLSelectElement;
    expect(select.value).toBe('desc');
  });

  it('defaults to asc order and keyName sort when params are omitted', () => {
    const doc = render();
    const sortBy = doc.querySelector('#sortBy') as HTMLSelectElement;
    const order = doc.querySelector('#order') as HTMLSelectElement;
    expect(sortBy.value).toBe('keyName');
    expect(order.value).toBe('asc');
  });

  it('form submits to /cache-key-stats with GET method', () => {
    const doc = render();
    const form = doc.querySelector('form#searchForm') as HTMLFormElement;
    expect(form.action).toMatch(/\/cache-key-stats$/);
    expect(form.method.toLowerCase()).toBe('get');
  });
});
