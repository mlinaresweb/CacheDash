        // tests/handlers/allServicesCallHistoryHandler.test.ts
        import { createMockRequest, createMockResponse } from '../utils/mockExpress';
        import { mockCollector } from '../utils/mockCollector';


describe('handleAllServicesCallHistory', () => {
  it('returns history in JSON', async () => {
    const history = [{ service: 'svc', timestamp: Date.now() }];
    const collector = mockCollector({
      getAllServicesCallHistory: jest.fn().mockReturnValue(history),
    });

    const { handleAllServicesCallHistory } = await import('../../../src/dashboard/handlers/index');
    const req = createMockRequest();
    const res = createMockResponse();

    await handleAllServicesCallHistory(req, res);

    expect(collector.getAllServicesCallHistory).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(history);
  });
});

