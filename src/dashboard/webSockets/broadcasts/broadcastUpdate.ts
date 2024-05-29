// src/webSockets/broadcasts/broadcastUpdate.ts
import { generateServiceListHtml } from '../../components/serviceList';
import { broadcast } from '../websocketServer';
import { GlobalCacheStatsCollector } from '../../globalCacheStatsCollector';

export async function broadcastUpdate(): Promise<void> {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const allStats = globalCacheStatsCollector.getAllStats();
    const html = generateServiceListHtml(allStats);
    broadcast({ type: 'UPDATE_VIEW', html });

    for (const service of globalCacheStatsCollector.getServiceRegistry().keys()) {
        await globalCacheStatsCollector.broadcastUpdateDashboard(service);
    }
}
