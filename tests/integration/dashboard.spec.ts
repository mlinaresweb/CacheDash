import request from 'supertest';
import { GlobalCacheStatsCollector } from '../../src/dashboard/globalCacheStatsCollector';

describe('Dashboard HTTP routes', () => {
  const gc = GlobalCacheStatsCollector.getInstance();

  beforeAll(() => gc.enableMonitoring(5000));
  afterAll(() => gc.disableMonitoring());

  it('serves index.html', async () => {
    const res = await request('http://localhost:5000').get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<!DOCTYPE html>/);
  });
});
