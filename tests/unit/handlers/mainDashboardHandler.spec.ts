        // tests/handlers/mainDashboardHandler.test.ts
        import { createMockRequest, createMockResponse } from '../utils/mockExpress';
        import { mockCollector } from '../utils/mockCollector';


describe('handleMainDashboard', () => {
  it('renders dashboard html', async () => {
    mockCollector({ getAllStats: jest.fn().mockReturnValue(new Map()), getKeyStatsRegistry: jest.fn().mockReturnValue(new Map()) });
    const { handleMainDashboard } = await import('../../../src/dashboard/handlers/index');
    const req = createMockRequest();
    const res = createMockResponse();

    handleMainDashboard(req, res);
    expect(res.send).toHaveBeenCalled();
  });
});

