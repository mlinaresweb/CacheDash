// src/handlers/exportKeyStatsHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';

export function  handleExportKeyStats(req: Request, res: Response): void {
     const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const { service } = req.query;
    const keyStats = globalCacheStatsCollector.getKeyStatsRegistry().get(service as string);
    if (keyStats) {
        const csv = globalCacheStatsCollector.generateCsv(Array.from(keyStats.values()));
        res.header('Content-Type', 'text/csv');
        res.attachment(`${service}-key-stats.csv`);
        res.send(csv);
    } else {
        res.sendStatus(404);
    }
}