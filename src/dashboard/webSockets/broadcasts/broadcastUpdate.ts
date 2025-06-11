// src/webSockets/broadcasts/broadcastUpdate.ts
import { generateServiceListViewHtml } from '../../views/pages/ServiceListView';
import { wss, broadcast } from '../websocketServer';
import { GlobalCacheStatsCollector } from '../../globalCacheStatsCollector';

export async function broadcastUpdate(): Promise<void> {
      if (wss.clients.size === 0) return;
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const allStats = globalCacheStatsCollector.getAllStats();
    const html = generateServiceListViewHtml(allStats);
    broadcast({ type: 'UPDATE_VIEW', html });

    for (const service of globalCacheStatsCollector.getServiceRegistry().keys()) {
        await globalCacheStatsCollector.broadcastUpdateDashboard(service);
    }
}
