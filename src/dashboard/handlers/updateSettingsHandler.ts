// src/handlers/updateSettingsHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';

export function handleUpdateSettings(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const { serviceIdentifier, ttl, maxMemorySize } = req.body;
    const service = globalCacheStatsCollector.getService(serviceIdentifier);
    if (service) {
        const newMaxMemorySizeMB = maxMemorySize ? parseFloat(maxMemorySize) : undefined;
        if (newMaxMemorySizeMB !== undefined && (isNaN(newMaxMemorySizeMB) || newMaxMemorySizeMB <= 0)) {
            res.status(400).send('Invalid max memory size');
            return;
        }
        service.updateConfig(ttl ? parseInt(ttl) : undefined, newMaxMemorySizeMB);
        const updatedStats = service.getStats();
        globalCacheStatsCollector.getStatsRegistry().set(serviceIdentifier, updatedStats);

        res.send(`Updated settings for service: ${serviceIdentifier}`);
    } else {
        res.status(404).send('Service not found');
    }
}
