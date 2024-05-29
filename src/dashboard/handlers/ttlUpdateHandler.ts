// src/handlers/ttlUpdateHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';


export function handleUpdateTtl(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const { service, key, ttl } = req.body;
    const cacheService = globalCacheStatsCollector.getService(service);
    const numericTTL = Number(ttl);
    if (isNaN(numericTTL)) {
        res.status(400).json({ message: 'TTL must be a number' });
        return;
    }
    if (cacheService) {
        cacheService.get<any>(key)
            .then(data => {
                if (data !== undefined) {
                    return cacheService.set(key, data, numericTTL, true);
                } else {
                    res.status(404).json({ message: 'Key not found' });
                }
            })
            .then(() => {
                res.json({ message: 'TTL updated successfully' });
                return GlobalCacheStatsCollector.getInstance().broadcastUpdateDashboard(service);
            })
            .catch(() => res.status(500).json({ message: 'Failed to update TTL' }));
    } else {
        res.status(404).json({ message: 'Service not found' });
    }
}