// src/handlers/flushCacheHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';

export function handleFlushCache(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const { service } = req.body;
    const cacheService = globalCacheStatsCollector.getService(service);    
    if (cacheService) {
        cacheService.flush()
            .then(() => {
                res.json({ message: 'Cache flushed successfully' });
            })
            .catch(() => res.status(500).json({ message: 'Failed to flush cache' }));
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
}