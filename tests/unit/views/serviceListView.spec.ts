// tests/unit/views/serviceListView.spec.ts
// --------------------------------------------------
// Tests para generateServiceListViewHtml (views/ServiceListView.ts)
// --------------------------------------------------

// Necesario para JSDOM (anula mock global de setupTests)
jest.mock('http', () => jest.requireActual('http'));

// Mock del componente de lista de servicios para aislar la vista
jest.mock('../../../src/dashboard/components/serviceList/ServiceList', () => ({
  generateServiceListComponentHtml: jest.fn(() => '<div id="svcListStub">LIST</div>'),
  __esModule: true,
}));

import { JSDOM } from 'jsdom';
import { generateServiceListViewHtml } from '../../../src/dashboard/views/pages/ServiceListView';
import { generateServiceListComponentHtml } from '../../../src/dashboard/components/serviceList/ServiceList';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

function render() {
  const html = generateServiceListViewHtml(new Map());
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('views › generateServiceListViewHtml', () => {
  it('invokes generateServiceListComponentHtml once', () => {
    render();
    expect(generateServiceListComponentHtml).toHaveBeenCalledTimes(1);
  });

  it('contains heading and injected service list stub inside #service-list', () => {
    const doc = render();
    const heading = doc.querySelector('h1');
    expect(heading?.textContent).toMatch(/Cache Services.*Dashboard/i);

    const svcContainer = doc.getElementById('service-list');
    expect(svcContainer).toBeTruthy();
    expect(svcContainer?.querySelector('#svcListStub')).toBeTruthy();
  });

  it('script includes WebSocket connection to localhost:8081', () => {
    const doc = render();
    const scriptContent = doc.querySelector('script')?.textContent || '';
    expect(scriptContent).toContain("new WebSocket('ws://localhost:8081')");
    expect(scriptContent).toContain('updateServiceList');
  });
});
