        // tests/handlers/globalStatsChartsHandler.test.ts
        import { createMockRequest, createMockResponse } from '../utils/mockExpress';
        import { mockCollector } from '../utils/mockCollector';


describe('handleGlobalStatsCharts', () => {
  it('returns 403 when monitoring disabled', async () => {
    mockCollector({ isMonitoringEnabled: jest.fn().mockReturnValue(false) });
    const { handleGlobalStatsCharts } = await import('../../../src/dashboard/handlers/index');
    const req = createMockRequest();
    const res = createMockResponse();

    handleGlobalStatsCharts(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

