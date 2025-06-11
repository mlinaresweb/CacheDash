import { createMockRequest, createMockResponse } from '../utils/mockExpress';
import { mockCollector } from '../utils/mockCollector';

describe('handleCacheKeyStatsCharts', () => {
  it('returns 403 when monitoring disabled', async () => {
    mockCollector({ isMonitoringEnabled: jest.fn().mockReturnValue(false) });

    const { handleCacheKeyStatsCharts } = await import(
     '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest();
    const res = createMockResponse();

    handleCacheKeyStatsCharts(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 400 when service param missing', async () => {
    jest.resetModules(); // 🧹 limpia mocks previos

    mockCollector({ isMonitoringEnabled: jest.fn().mockReturnValue(true) });

    const { handleCacheKeyStatsCharts } = await import(
      '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest(); // sin ?service
    const res = createMockResponse();

    handleCacheKeyStatsCharts(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Service parameter is required.' });
  });
});
