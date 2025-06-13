// tests/unit/views/layoutView.spec.ts
// --------------------------------------------------
// Tests para generateLayoutHtml (views/layout.ts)
// --------------------------------------------------

jest.mock('http', () => jest.requireActual('http'));

// Mock de sidebar para aislar la vista
jest.mock('../../../src/dashboard/components/sidebar', () => ({
  generateSidebarHtml: jest.fn(() => '<nav id="sidebarStub"></nav>'),
  __esModule: true,
}));

import { JSDOM } from 'jsdom';
import { generateLayoutHtml } from '../../../src/dashboard/views/layout';
import { generateSidebarHtml } from '../../../src/dashboard/components/sidebar';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

function render(content: string) {
  const html = generateLayoutHtml(content);
  return new JSDOM(html).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('views › generateLayoutHtml', () => {
  it('calls generateSidebarHtml once', () => {
    render('<div>CONTENT</div>');
    expect(generateSidebarHtml).toHaveBeenCalledTimes(1);
  });

  it('injects sidebar and given content inside #content container', () => {
    const doc = render('<p id="mainContent">Hello</p>');
    expect(doc.getElementById('sidebarStub')).toBeTruthy();
    const contentDiv = doc.getElementById('content');
    expect(contentDiv?.querySelector('#mainContent')?.textContent).toBe('Hello');
  });

  it('head contains title and CSS links', () => {
    const doc = render('X');
    const title = doc.querySelector('title');
    expect(title?.textContent).toBe('CacheDash Dashboard');
    // check presence of at least one stylesheet link
    const links = doc.querySelectorAll('head link[rel="stylesheet"]');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});
