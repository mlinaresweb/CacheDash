        // tests/handlers/ttlUpdateHandler.test.ts
        import { createMockRequest, createMockResponse } from '../utils/mockExpress';
        import { mockCollector } from '../utils/mockCollector';


describe('handleUpdateTtl', () => {
  it('returns 400 when ttl is not numeric', async () => {
    mockCollector({ getService: jest.fn().mockReturnValue({}) });
    const { handleUpdateTtl } = await import('../../../src/dashboard/handlers/index');
    const req = createMockRequest({ body: { service: 'svc', key: 'k', ttl: 'abc' } });
    const res = createMockResponse();

    handleUpdateTtl(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'TTL must be a number' });
  });
});

