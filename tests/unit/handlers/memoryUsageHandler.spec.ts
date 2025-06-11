        // tests/handlers/memoryUsageHandler.test.ts
        import { createMockRequest, createMockResponse } from '../utils/mockExpress';
        import { mockCollector } from '../utils/mockCollector';


describe('handleMemoryUsage', () => {
  it('renders memory usage html', async () => {
    mockCollector({ getAllStats: jest.fn().mockReturnValue(new Map()) });
    const { handleMemoryUsage } = await import('../../../src/dashboard/handlers/index');
    const req = createMockRequest();
    const res = createMockResponse();

    handleMemoryUsage(req, res);
    expect(res.send).toHaveBeenCalled();
  });
});

