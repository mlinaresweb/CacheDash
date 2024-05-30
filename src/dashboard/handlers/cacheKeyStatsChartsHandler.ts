// src/handlers/cacheKeyStatsChartsHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { generateStatisticsViewHtml } from '../views/pages/StatisticsView';
import { generateLayoutHtml } from '../views/layout';

export function handleCacheKeyStatsCharts(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    if (!globalCacheStatsCollector.isMonitoringEnabled()) {
        res.status(403).json({ error: "Monitoring is disabled." });
        return;
    }
    const service = req.query.service as string;
    if (service) {
        const keyStats = globalCacheStatsCollector.getKeyStatsRegistry().get(service);
        if (!keyStats) {
            res.status(404).json({ error: "Service not found." });
            return;
        }
        let statsArray = Array.from(keyStats.values());
        const sortedByHits = statsArray.slice().sort((a, b) => b.hits - a.hits).slice(0, 6);
        const sortedBySize = statsArray.slice().sort((a, b) => b.size - a.size).slice(0, 6);
        const labelsHitsMisses = sortedByHits.map(stat => stat.keyName);
        const hits = sortedByHits.map(stat => stat.hits);
        const misses = sortedByHits.map(stat => stat.misses);
        const labelsSizes = sortedBySize.map(stat => stat.keyName);
        const sizes = sortedBySize.map(stat => stat.size / 1024);
        const totalStats = globalCacheStatsCollector.getAllStats().get(service);
        const totalHits = totalStats?.hits || 0;
        const totalMisses = totalStats?.misses || 0;
        const totalKeys = totalStats?.keys || 0;
        const totalSize = totalStats?.size || 0;
        const averageResponseTime = globalCacheStatsCollector.getAverageResponseTimes().get(service) || 0;
        const uncachedAverageResponseTime = globalCacheStatsCollector.getAverageUncachedResponseTimes().get(service) || 0;
        const totalEvictions = totalStats?.evictions || 0;
        const keyResponseTimesData = globalCacheStatsCollector.getKeyResponseTimes(service);
        const keyResponseLabels = keyResponseTimesData.labels;
        const keyResponseTimes = keyResponseTimesData.responseTimes;
        const uncachedKeyResponseTimesData = globalCacheStatsCollector.getKeyUncachedResponseTimes(service);
        const uncachedKeyResponseLabels = uncachedKeyResponseTimesData.labels;
        const uncachedKeyResponseTimes = uncachedKeyResponseTimesData.responseTimes;
        const statisticsView = generateStatisticsViewHtml(service, labelsHitsMisses, hits, misses, sizes, totalHits, totalMisses, totalKeys, totalSize, averageResponseTime, uncachedAverageResponseTime, keyResponseTimes, keyResponseLabels, uncachedKeyResponseTimes, uncachedKeyResponseLabels, totalStats?.keysAdded || 0, totalStats?.keysDeleted || 0, totalEvictions);
        res.send(statisticsView);
    } else {
        res.status(400).json({ error: "Service parameter is required." });
    }
}
