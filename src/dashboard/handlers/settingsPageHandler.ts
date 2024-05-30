// src/handlers/settingsPageHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { generateSettingsPageHtml } from '../views/pages/SettingsView';
import { generateLayoutHtml } from '../views/layout';

export function handleSettingsPage(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const settingsView = generateSettingsPageHtml(globalCacheStatsCollector.getServiceRegistry());
    const html = generateLayoutHtml(settingsView);
    res.send(html);
}
