// src/handlers/globalStatsChartsHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { generateGlobalChartsHtml } from '../components/generateGlobalSummaryHtml';

export function handleGlobalStatsCharts(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    if (!globalCacheStatsCollector.isMonitoringEnabled()) {
        res.status(403).json({ error: "Monitoring is disabled." });
        return;
    }
    const allStats = Array.from(globalCacheStatsCollector.getAllStats().entries());
    const totalHits = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.hits, 0);
    const totalMisses = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.misses, 0);
    const totalKeys = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.keys, 0);
    const totalSize = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.size, 0);
    const totalKeysAdded = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.keysAdded, 0);
    const totalKeysDeleted = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.keysDeleted, 0);
    const totalEvictions = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.evictions, 0);
    const averageResponseTime = totalHits ? allStats.reduce((sum, [serviceIdentifier, stats]) => sum + (stats.hits * globalCacheStatsCollector.getAverageResponseTimes().get(serviceIdentifier)!), 0) / totalHits : 0;
    const uncachedAverageResponseTime = totalHits ? allStats.reduce((sum, [serviceIdentifier, stats]) => sum + (stats.hits * globalCacheStatsCollector.getAverageUncachedResponseTimes().get(serviceIdentifier)!), 0) / totalHits : 0;
    const labels: string[] = [];
    const hits: number[] = [];
    const misses: number[] = [];
    const sizes: number[] = [];
    globalCacheStatsCollector.getKeyStatsRegistry().forEach((keyStats, service) => {
        keyStats.forEach(stat => {
            labels.push(stat.keyName);
            hits.push(stat.hits);
            misses.push(stat.misses);
            sizes.push(stat.size / 1024);
        });
    });
    const keyResponseTimesData = globalCacheStatsCollector.getKeyResponseTimes();
    const keyResponseLabels = keyResponseTimesData.labels;
    const keyResponseTimes = keyResponseTimesData.responseTimes;
    const uncachedKeyResponseTimesData = globalCacheStatsCollector.getKeyUncachedResponseTimes();
    const uncachedKeyResponseLabels = uncachedKeyResponseTimesData.labels;
    const uncachedKeyResponseTimes = uncachedKeyResponseTimesData.responseTimes;
    const html = generateGlobalChartsHtml(labels, hits, misses, sizes, totalHits, totalMisses, totalKeys, totalSize, averageResponseTime, uncachedAverageResponseTime, keyResponseTimes, keyResponseLabels, uncachedKeyResponseTimes, uncachedKeyResponseLabels, totalKeysAdded, totalKeysDeleted, totalEvictions);
    res.send(html);
}
