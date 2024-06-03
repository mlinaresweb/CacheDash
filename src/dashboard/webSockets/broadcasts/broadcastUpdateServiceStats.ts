import { broadcast } from '../websocketServer';
import { GlobalCacheStatsCollector } from '../../globalCacheStatsCollector';
import { generateStatisticsViewHtml } from '../../views/pages/StatisticsView';

export async function broadcastUpdateServiceStats(service: string): Promise<void> {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const keyStats = globalCacheStatsCollector.getKeyStatsRegistry().get(service);
    if (!keyStats) return;

    const statsArray = Array.from(keyStats.values());
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

    const html = generateStatisticsViewHtml(
        service, labelsHitsMisses, hits, misses, labelsSizes, sizes, totalHits, totalMisses, totalKeys, totalSize, 
        averageResponseTime, uncachedAverageResponseTime, keyResponseTimes, keyResponseLabels, 
        uncachedKeyResponseTimes, uncachedKeyResponseLabels, totalStats?.keysAdded || 0, 
        totalStats?.keysDeleted || 0, totalEvictions
    );

    broadcast({
        type: 'UPDATE_SERVICE_STATISTICS',
        service,
        html,
        labelsHitsMisses,
        hits,
        misses,
        labelsSizes,
        sizes,
        keyResponseTimes,
        keyResponseLabels,
        uncachedKeyResponseTimes,
        uncachedKeyResponseLabels
    });
}
