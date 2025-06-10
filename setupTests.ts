// Arranca un Redis de prueba en memoria
import IORedis from 'ioredis-mock';

jest.mock('ioredis', () => IORedis);

// Silencia los logs en tests
jest.spyOn(console, 'log').mockImplementation(() => undefined);
