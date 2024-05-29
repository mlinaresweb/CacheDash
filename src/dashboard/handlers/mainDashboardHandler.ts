// src/handlers/mainDashboardHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { generateMainDashboardHtml } from '../components/generateMainDashboardHtml';


export function handleMainDashboard(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const allStats = globalCacheStatsCollector.getAllStats();
    const keyStatsRegistry = globalCacheStatsCollector.getKeyStatsRegistry();
    const html = generateMainDashboardHtml(allStats, keyStatsRegistry);
    res.send(html);
}