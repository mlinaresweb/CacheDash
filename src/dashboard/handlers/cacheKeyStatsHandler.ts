// src/handlers/cacheKeyStatsHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { KeyStats } from '../../types/cache';
import { generateServiceListViewHtml } from '../views/pages/ServiceListView';
import { generateKeyStatsViewHtml } from '../views/pages/KeyStatsView';
import { generateLayoutHtml } from '../views/layout';
export function handleCacheKeyStats(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    if (!globalCacheStatsCollector.isMonitoringEnabled()) {
        res.status(403).json({ error: "Monitoring is disabled." });
        return;
    }
    const service = req.query.service as string;
    const searchKey = req.query.searchKey as string;
    const sortBy = req.query.sortBy as keyof KeyStats || 'keyName';
    const order = req.query.order as 'asc' | 'desc' || 'asc';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    if (service) {
        const { keyStats, totalItems } = globalCacheStatsCollector.getKeyStatsForService(service, searchKey, page, limit, sortBy, order);
        const dashboardServicesView = generateKeyStatsViewHtml(service, keyStats, totalItems, searchKey, page, limit, sortBy, order);
        res.send(dashboardServicesView);
    } else {
        const allStats = globalCacheStatsCollector.getAllStats();
        const serviceListView = generateServiceListViewHtml(allStats);
        res.send(serviceListView);
    }
}
