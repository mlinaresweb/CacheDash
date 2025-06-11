        // tests/handlers/settingsPageHandler.test.ts
        import { createMockRequest, createMockResponse } from '../utils/mockExpress';
        import { mockCollector } from '../utils/mockCollector';


describe('handleSettingsPage', () => {
  it('renders settings page', async () => {
    mockCollector({ getServiceRegistry: jest.fn().mockReturnValue(new Map()) });
    const { handleSettingsPage } = await import('../../../src/dashboard/handlers/index');
    const req = createMockRequest();
    const res = createMockResponse();

    handleSettingsPage(req, res);
    expect(res.send).toHaveBeenCalled();
  });
});

