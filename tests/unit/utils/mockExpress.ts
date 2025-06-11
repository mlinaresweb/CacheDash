// tests/utils/mockExpress.ts
import { Request, Response } from 'express';
import { jest } from '@jest/globals';

export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    query: {},
    body: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

export function createMockResponse(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.attachment = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  return res as Response;
}
