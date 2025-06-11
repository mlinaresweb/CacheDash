import { createMockRequest, createMockResponse } from '../utils/mockExpress';
import { mockCollector } from '../utils/mockCollector';

describe('handleExportKeyStats', () => {
  it('returns 404 when service not found', async () => {
    mockCollector({ getKeyStatsRegistry: jest.fn().mockReturnValue(new Map()) });

    const { handleExportKeyStats } = await import(
       '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest({ query: { service: 'svc' } });
    const res = createMockResponse();

    handleExportKeyStats(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(404);
  });

  it('exports csv when stats present', async () => {
    jest.resetModules();  // 🧹

    const keyStatsMap = new Map([
      ['myKey', { keyName: 'myKey', hits: 1, misses: 0, size: 10 }],
    ]);
    const registry = new Map().set('svc', keyStatsMap);

    mockCollector({
      getKeyStatsRegistry: jest.fn().mockReturnValue(registry),
      generateCsv        : jest.fn().mockReturnValue('csvdata'),
    });

    const { handleExportKeyStats } = await import(
      '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest({ query: { service: 'svc' } });
    const res = createMockResponse();

    handleExportKeyStats(req, res);

    expect(res.send).toHaveBeenCalledWith('csvdata');
  });
});
