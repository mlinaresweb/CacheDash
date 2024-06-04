// src/handlers/mainDashboardHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { generateMainDashboardHtml } from '../views/pages/MainDashboard';
import { generateLayoutHtml } from '../views/layout';

export function handleMainDashboard(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const allStats = globalCacheStatsCollector.getAllStats();
    const keyStatsRegistry = globalCacheStatsCollector.getKeyStatsRegistry();
    const mainDashboardHtml = generateMainDashboardHtml(allStats, keyStatsRegistry);
    const html = generateLayoutHtml(mainDashboardHtml);
    res.send(html);
}
