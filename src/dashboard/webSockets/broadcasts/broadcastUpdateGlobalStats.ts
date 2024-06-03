import { broadcast } from '../websocketServer';
import { GlobalCacheStatsCollector } from '../../globalCacheStatsCollector';
import { generateStatisticsGlobalViewHtml } from '../../views/pages/StatisticsGlobalView';

export async function broadcastUpdateGlobalStats(): Promise<void> {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
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

    const html = generateStatisticsGlobalViewHtml(
        "Global", labels, hits, misses, sizes, totalHits, totalMisses, totalKeys, totalSize, 
        averageResponseTime, uncachedAverageResponseTime, keyResponseTimes, keyResponseLabels, 
        uncachedKeyResponseTimes, uncachedKeyResponseLabels, totalKeysAdded, totalKeysDeleted, totalEvictions
    );

    broadcast({
        type: 'UPDATE_GLOBAL_STATISTICS',
        html,
        labels,
        hits,
        misses,
        sizes,
        keyResponseTimes,
        keyResponseLabels,
        uncachedKeyResponseTimes,
        uncachedKeyResponseLabels
    });
}
