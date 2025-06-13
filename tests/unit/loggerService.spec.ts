// tests/unit/utils/loggerService.spec.ts
// --------------------------------------------------
// Tests para InMemoryLogger (utils/loggerService.ts)
// --------------------------------------------------

import { InMemoryLogger } from '../../src/dashboard/utils/loggerService';

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('utils › InMemoryLogger', () => {
  let logger: InMemoryLogger;
  const NOW = new Date('2025-06-13T12:00:00Z');

  beforeEach(() => {
    logger = new InMemoryLogger();
    jest.spyOn(global, 'Date').mockImplementationOnce(() => NOW as unknown as Date);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('adds a log entry with correct fields', () => {
    logger.log('svcA', 'something happened', 'info');
    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    const entry = logs[0];
    expect(entry.service).toBe('svcA');
    expect(entry.message).toBe('something happened');
    expect(entry.type).toBe('info');
    expect(entry.timestamp).toEqual(NOW);
  });

  it('filters logs by service', () => {
    logger.log('svcA', '1', 'info');
    logger.log('svcB', '2', 'warn');
    logger.log('svcA', '3', 'error');
    const svcALogs = logger.getLogs('svcA');
    expect(svcALogs.length).toBe(2);
    svcALogs.forEach((l) => expect(l.service).toBe('svcA'));
  });

  it('returns empty array when no logs for a service', () => {
    logger.log('svcX', 'msg', 'info');
    expect(logger.getLogs('non-existent')).toEqual([]);
  });
});
