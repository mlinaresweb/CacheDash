// src/webSockets/broadcasts/broadcastUpdateGlobalDashboard.ts
import { generateMainDashboardHtml } from '../../views/pages/MainDashboard';
import { broadcast } from '../websocketServer';
import { GlobalCacheStatsCollector } from '../../globalCacheStatsCollector';

export async function broadcastUpdateGlobalDashboard(service: string): Promise<void> {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const keyStats = globalCacheStatsCollector.getKeyStatsRegistry().get(service) || new Map();
    const statsArray = Array.from(keyStats.values());
    const totalItems = statsArray.length;
    const html = generateMainDashboardHtml(globalCacheStatsCollector.getAllStats(), globalCacheStatsCollector.getKeyStatsRegistry());
    broadcast({ type: 'UPDATE_GLOBAL_DASHBOARD', html });
}
