// src/webSockets/broadcasts/broadcastUpdate.ts
import { generateServiceListViewHtml } from '../../views/pages/ServiceListView';
import { broadcast } from '../websocketServer';
import { GlobalCacheStatsCollector } from '../../globalCacheStatsCollector';

export async function broadcastUpdate(): Promise<void> {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const allStats = globalCacheStatsCollector.getAllStats();
    const html = generateServiceListViewHtml(allStats);
    broadcast({ type: 'UPDATE_VIEW', html });

    for (const service of globalCacheStatsCollector.getServiceRegistry().keys()) {
        await globalCacheStatsCollector.broadcastUpdateDashboard(service);
    }
}
