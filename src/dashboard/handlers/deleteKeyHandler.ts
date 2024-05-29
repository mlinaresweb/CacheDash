// src/handlers/deleteKeyHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';

export function handleDeleteKey(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const { service, key } = req.body;
    const cacheService = globalCacheStatsCollector.getService(service);
    if (cacheService) {
        cacheService.del(key)
            .then(() => {
                res.json({ message: 'Key deleted successfully' });
            })
            .catch(() => res.status(500).json({ message: 'Failed to delete key' }));
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
}
