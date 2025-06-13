/**
 * Edge 6.2 – Clave 512 MB gzipped → MemoryCard no rompe ni fuga memoria
 */
import Redis from 'ioredis-mock';
import { gzipSync } from 'zlib';

const redis = new Redis();
const KB = 1024;
const MB = KB * KB;
const LARGE_BYTES = 512 * MB;          // 512 MiB

// Simula MemoryCard (fragmento relevante)
async function memoryCardGet(key: string): Promise<Buffer> {
  const gz = await redis.getBuffer(key);
  return gz ? Buffer.from(gz) : Buffer.alloc(0);
}

describe('edge › clave 512 MB gzipped', () => {
  const KEY = 'huge:key:zipped';

  beforeAll(async () => {
    const huge = Buffer.alloc(LARGE_BYTES, 0xab);
    const gz = gzipSync(huge, { level: 1 });       // ~ 3‑5 MB
    await redis.set(KEY, gz);
  });

  it('MemoryCard no lanza ni excede +100 MB heap', async () => {
    const memBefore = process.memoryUsage().heapUsed;
    const buf = await memoryCardGet(KEY);
    const memAfter  = process.memoryUsage().heapUsed;

    // El buffer devuelto es el gzipped, no el des‑gzip
    expect(buf.byteLength).toBeGreaterThan(1 * MB);
    expect(memAfter - memBefore).toBeLessThan(100 * MB);
  });
});
afterAll(() => redis.disconnect());