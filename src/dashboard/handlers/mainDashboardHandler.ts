// src/handlers/mainDashboardHandler.ts
// src/handlers/handleMainDashboard.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { generateMainDashboardHtml } from '../views/pages/MainDashboard';

export function handleMainDashboard(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const allStats = globalCacheStatsCollector.getAllStats();
    const keyStatsRegistry = globalCacheStatsCollector.getKeyStatsRegistry();
    const mainDashboardHtml = generateMainDashboardHtml(allStats, keyStatsRegistry);
    
    res.send(mainDashboardHtml);
}
