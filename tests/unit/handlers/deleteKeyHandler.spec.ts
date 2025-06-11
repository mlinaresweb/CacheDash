import { createMockRequest, createMockResponse } from '../utils/mockExpress';
import { mockCollector } from '../utils/mockCollector';

describe('handleDeleteKey', () => {
  it('returns 404 when service not found', async () => {
    mockCollector({ getService: jest.fn().mockReturnValue(undefined) });

    const { handleDeleteKey } = await import(
      '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest({ body: { service: 'svc', key: 'k' } });
    const res = createMockResponse();

    await handleDeleteKey(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deletes key and returns success', async () => {
    jest.resetModules();  // 🧹

    const delMock = jest.fn().mockResolvedValue(undefined);
    mockCollector({ getService: jest.fn().mockReturnValue({ del: delMock }) });

    const { handleDeleteKey } = await import(
      '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest({ body: { service: 'svc', key: 'k' } });
    const res = createMockResponse();

    await handleDeleteKey(req, res);
    await new Promise(setImmediate);

    expect(delMock).toHaveBeenCalledWith('k');
    expect(res.json).toHaveBeenCalledWith({ message: 'Key deleted successfully' });
  });
});
