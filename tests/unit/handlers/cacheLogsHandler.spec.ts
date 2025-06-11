        // tests/handlers/cacheLogsHandler.test.ts
import { createMockRequest, createMockResponse } from '../utils/mockExpress';
import { mockCollector } from '../utils/mockCollector';
import path from 'node:path';

describe('handleLogs', () => {
  it('returns html log view', async () => {
    mockCollector({ getServiceRegistryKeys: jest.fn().mockReturnValue([]) });

    const loggerPath = require.resolve(
      path.join(process.cwd(), 'src', 'dashboard', 'utils', 'loggerService')
    );
    jest.doMock(loggerPath, () => ({
      logger: {
        getLogs: jest.fn().mockReturnValue([
          { timestamp: new Date(), message: 'test' },
        ]),
      },
    }));

    const { handleLogs } = await import(
      '../../../src/dashboard/handlers/index'
    );

    const req = createMockRequest();
    const res = createMockResponse();

    handleLogs(req, res);
    expect(res.send).toHaveBeenCalled();
  });
});
