// src/handlers/memoryUsageHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { generateMemoryUsageHtml } from '../components/generateMemoryUsageHtml';


export function handleMemoryUsage(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const allStats = globalCacheStatsCollector.getAllStats();
    const html = generateMemoryUsageHtml(allStats);
    res.send(html);
}