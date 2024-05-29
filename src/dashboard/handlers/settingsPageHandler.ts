// src/handlers/settingsPageHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { generateSettingsPageHtml } from '../components/generateSettingsPageHtml';

export function handleSettingsPage(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const html = generateSettingsPageHtml(globalCacheStatsCollector.getServiceRegistry());
    res.send(html);
}
