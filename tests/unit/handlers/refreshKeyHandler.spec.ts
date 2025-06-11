        // tests/handlers/refreshKeyHandler.test.ts
        import { createMockRequest, createMockResponse } from '../utils/mockExpress';
        import { mockCollector } from '../utils/mockCollector';


describe('handleRefreshKey', () => {
  it('returns 404 when service not found', async () => {
    mockCollector({ getService: jest.fn().mockReturnValue(undefined) });
    const { handleRefreshKey } = await import('../../../src/dashboard/handlers/index');
    const req = createMockRequest({ body: { service: 'svc', key: 'k' } });
    const res = createMockResponse();

    handleRefreshKey(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

