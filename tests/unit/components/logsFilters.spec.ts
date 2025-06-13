// tests/unit/components/logsFilters.spec.ts

// JSDOM necesita el módulo real 'http'.
jest.mock('http', () => jest.requireActual('http'));

import { JSDOM } from 'jsdom';
import { generateFiltersHtml } from '../../../src/dashboard/components/logs/Filters';

/* -------------------------------------------------------------------------- */
/* Helper */
/* -------------------------------------------------------------------------- */

function render(services: string[], isGlobal: boolean, currentService?: string) {
  const html = generateFiltersHtml(services, isGlobal, currentService);
  return new JSDOM(html).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests */
/* -------------------------------------------------------------------------- */

describe('components › logs/generateFiltersHtml', () => {
  const SERVICE_OPTS = ['auth‑svc', 'cache‑svc', 'api‑svc'];

  describe('service filter select', () => {
    it('is rendered with an option per service when isGlobal = true', () => {
      const doc = render(SERVICE_OPTS, true);
      const select = doc.querySelector('#serviceFilter') as HTMLSelectElement;
      expect(select).toBeTruthy();
      // +1 for "All Services"
      expect(select.options.length).toBe(SERVICE_OPTS.length + 1);
      expect(select.options[0].value).toBe('');
      SERVICE_OPTS.forEach((svc, idx) => {
        expect(select.options[idx + 1].value).toBe(svc);
      });
    });

    it('is omitted when isGlobal = false', () => {
      const doc = render(SERVICE_OPTS, false);
      expect(doc.querySelector('#serviceFilter')).toBeNull();
    });

    it('contains only the "All Services" option when services[] está vacío', () => {
      const doc = render([], true);
      const select = doc.querySelector('#serviceFilter') as HTMLSelectElement;
      expect(select.options.length).toBe(1);
      expect(select.options[0].textContent).toMatch(/All Services/i);
    });
  });

  describe('back button', () => {
    it('is rendered with correct href when currentService provided', () => {
      const doc = render(SERVICE_OPTS, false, 'cache‑svc');
      const link = doc.querySelector('a.btn.btn-secondary') as HTMLAnchorElement;
      expect(link).toBeTruthy();
      expect(link.href).toMatch(/\/cache-key-stats\?service=cache‑svc$/);
    });

    it('is not rendered when currentService is undefined', () => {
      const doc = render(SERVICE_OPTS, false);
      expect(doc.querySelector('a.btn.btn-secondary')).toBeNull();
    });
  });

  describe('static filter inputs', () => {
    const doc = render(SERVICE_OPTS, true);

    it('renders #startTimestamp datetime-local input', () => {
      const input = doc.querySelector('#startTimestamp') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('datetime-local');
    });

    it('renders #search text input', () => {
      const input = doc.querySelector('#search') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('text');
    });

    it('renders #messageType select with expected options', () => {
      const select = doc.querySelector('#messageType') as HTMLSelectElement;
      const expectedOpts = ['', 'set', 'hit', 'miss', 'delete', 'flush', 'expire', 'error'];
      const values = Array.from(select.options).map(o => o.value);
      expect(values).toEqual(expectedOpts);
    });
  });
});
