import { createMockRequest, createMockResponse } from '../utils/mockExpress';
import { mockCollector } from '../utils/mockCollector';

describe('handleUpdateSettings', () => {
  it('returns 400 when memory size invalid', async () => {
    jest.resetModules();  // 🧹 porque otro test usa 404 scenario

    const serviceStub = {
      updateConfig: jest.fn(),
      getStats    : jest.fn().mockReturnValue({}),
    };
    mockCollector({ getService: jest.fn().mockReturnValue(serviceStub) });

    const { handleUpdateSettings } = await import(
      '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest({
      body: { serviceIdentifier: 'svc', maxMemorySize: '-1' },
    });
    const res = createMockResponse();

    handleUpdateSettings(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
