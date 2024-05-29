// src/handlers/refeshKeyHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';

export function handleRefreshKey(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const { service, key } = req.body;
    const cacheService = globalCacheStatsCollector.getService(service);    
    if (cacheService) {
        cacheService.get<any>(key)
            .then(data => {
                if (data !== undefined) {
                    const keyStats = cacheService.getKeyStats().get(key);
                    const originalTTL = keyStats ? keyStats.ttl : undefined;
                    return cacheService.set(key, data, originalTTL, true);
                } else {
                    res.status(404).json({ message: 'Key not found' });
                }
            })
            .then(() => {
                res.json({ message: 'Key refreshed successfully' });
                return GlobalCacheStatsCollector.getInstance().broadcastUpdateDashboard(service);
            })
            .catch(() => res.status(500).json({ message: 'Failed to refresh key' }));
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
}