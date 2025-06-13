// tests/unit/views/settingsView.spec.ts
// --------------------------------------------------
// Tests para generateSettingsPageHtml (views/SettingsView.ts)
// --------------------------------------------------

// Necesario para JSDOM real
jest.mock('http', () => jest.requireActual('http'));

// Mock del componente generateCacheServiceSettingsHtml para aislar la vista
jest.mock('../../../src/dashboard/components/cacheServiceSettings', () => ({
  generateCacheServiceSettingsHtml: jest.fn((_: any, id: string) => `<section class="settingsStub" data-id="${id}"></section>`),
  __esModule: true,
}));

import { JSDOM } from 'jsdom';
import { generateSettingsPageHtml } from '../../../src/dashboard/views/pages/SettingsView';
import { generateCacheServiceSettingsHtml } from '../../../src/dashboard/components/cacheServiceSettings';

import type { LocalCacheService } from '../../../src/local/localCacheService';
import type { RedisCacheService } from '../../../src/redis/redisCacheService';

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

function fakeSvc(): LocalCacheService | RedisCacheService {
  return {
    getConfig: () => ({ ttl: 100, maxMemorySizeMB: 256 }),
  } as unknown as LocalCacheService;
}

function render() {
  const registry = new Map<string, LocalCacheService | RedisCacheService>([
    ['svcA', fakeSvc()],
    ['svcB', fakeSvc()],
  ]);
  const html = generateSettingsPageHtml(registry);
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('views › generateSettingsPageHtml', () => {
  it('calls generateCacheServiceSettingsHtml for each service with correct id', () => {
    render();
    expect(generateCacheServiceSettingsHtml).toHaveBeenCalledTimes(2);
    expect(generateCacheServiceSettingsHtml).toHaveBeenCalledWith(expect.anything(), 'svcA');
    expect(generateCacheServiceSettingsHtml).toHaveBeenCalledWith(expect.anything(), 'svcB');
  });

  it('renders heading and contains stub sections per service', () => {
    const doc = render();
    expect(doc.querySelector('h1')?.textContent).toMatch(/Cache.*Settings/i);

    const stubs = doc.querySelectorAll('.settingsStub');
    const ids = Array.from(stubs).map((el) => el.getAttribute('data-id'));
    expect(ids).toEqual(['svcA', 'svcB']);
  });

  it('script includes fetch to /update-settings and function updateSettings', () => {
    const doc = render();
    const script = doc.querySelector('script')?.textContent || '';
    expect(script).toContain("fetch('/update-settings'");
    expect(script).toContain('function updateSettings');
  });
});
