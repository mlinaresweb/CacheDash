// src/handlers/allServicesCallHistoryHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';

export async function handleAllServicesCallHistory(req: Request, res: Response): Promise<void> {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const callHistory = globalCacheStatsCollector.getAllServicesCallHistory();
    res.json(callHistory);
}
