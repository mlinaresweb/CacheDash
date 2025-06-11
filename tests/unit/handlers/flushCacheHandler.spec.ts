import { createMockRequest, createMockResponse } from '../utils/mockExpress';
import { mockCollector } from '../utils/mockCollector';

describe('handleFlushCache', () => {
  it('returns 404 when service not found', async () => {
    mockCollector({ getService: jest.fn().mockReturnValue(undefined) });

    const { handleFlushCache } = await import(
      '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest({ body: { service: 'svc' } });
    const res = createMockResponse();

    handleFlushCache(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('flushes successfully', async () => {
    jest.resetModules();                                // 🧹 limpia el cache

    const flushMock = jest.fn().mockResolvedValue(undefined);
    mockCollector({ getService: jest.fn().mockReturnValue({ flush: flushMock }) });

    const { handleFlushCache } = await import(
      '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest({ body: { service: 'svc' } });
    const res = createMockResponse();

    await handleFlushCache(req, res);
    await new Promise(setImmediate);                    // espera micro‑task

    expect(flushMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Cache flushed successfully' });
  });
});
