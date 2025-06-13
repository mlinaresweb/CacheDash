// tests/unit/components/sidebar.spec.ts
// --------------------------------------------------
// Tests para generateSidebarHtml (sidebar.ts)
// --------------------------------------------------

// JSDOM requiere el módulo http real — anulamos mock global.
jest.mock('http', () => jest.requireActual('http'));

// Mock del GlobalCacheStatsCollector para controlar servicios activos.
jest.mock('../../../src/dashboard/globalCacheStatsCollector', () => {
  const fakeMap = new Map<string, any>([
    ['svc1', {}],
    ['svc2', {}],
  ]);
  return {
    GlobalCacheStatsCollector: {
      getInstance: () => ({
        getAllStats: () => fakeMap,
      }),
    },
    __esModule: true,
  };
});

import { JSDOM } from 'jsdom';
import { generateSidebarHtml } from '../../../src/dashboard/components/sidebar';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

function render() {
  const html = generateSidebarHtml();
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('components › generateSidebarHtml', () => {
  const SIDEBAR_LINKS = [
    '/dashboard',
    '/cache-key-stats',
    '/logs',
    '/settings',
  ];

  it('renders main sidebar container and core nav links', () => {
    const doc = render();
    const sidebar = doc.querySelector('div.sidebar');
    expect(sidebar).toBeTruthy();

    SIDEBAR_LINKS.forEach((href) => {
      const link = sidebar!.querySelector(`a[href="${href}"]`);
      expect(link).toBeTruthy();
    });
  });

  it('injects a services submenu with one link per active service', () => {
    const doc = render();
    const submenu = doc.querySelector('#serviceListSubmenu');
    const serviceLinks = submenu?.querySelectorAll('a.services-sidebar');
    expect(serviceLinks?.length).toBe(2);
    const hrefs = Array.from(serviceLinks!).map((l) => l.getAttribute('href'));
    expect(hrefs).toEqual([
      '/cache-key-stats?service=svc1',
      '/cache-key-stats?service=svc2',
    ]);
  });

  it('includes toggleSubmenu icon with id="toggleSubmenu"', () => {
    const doc = render();
    const toggle = doc.getElementById('toggleSubmenu');
    expect(toggle).toBeTruthy();
  });
});
