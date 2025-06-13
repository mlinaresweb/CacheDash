/**
 * Edge 6.1 – devuelve 10 elementos de 1 M claves en < 1 s
 */
import Redis from 'ioredis-mock';
import { performance } from 'perf_hooks';

const redis = new Redis();
const TOTAL_KEYS = 1_000_000;
const PAGE_SIZE  = 10;

async function seedFakeRedis() {
  const pipeline = redis.pipeline();
  for (let i = 0; i < TOTAL_KEYS; i++) pipeline.set(`k:${i}`, i);
  await pipeline.exec();
}

async function paginate(page: number, size: number) {
  const start = page * size;
  const end   = start + size - 1;
  const keys  = await redis.scanBuffer(0, 'MATCH', 'k:*', 'COUNT', TOTAL_KEYS);
  return keys[1].slice(start, end + 1).map(k => k.toString());
}

describe('edge › redis 1 M claves', () => {
  beforeAll(() => seedFakeRedis());

  it('paginación < 1 s', async () => {
    const t0 = performance.now();
    const page0 = await paginate(0, PAGE_SIZE);
    const elapsed = performance.now() - t0;

    expect(page0.length).toBe(PAGE_SIZE);
    expect(elapsed).toBeLessThan(1_000);
  });
});
afterAll(() => redis.disconnect());