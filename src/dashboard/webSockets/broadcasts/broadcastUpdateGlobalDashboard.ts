// src/webSockets/broadcasts/broadcastUpdateGlobalDashboard.ts
import { generateMainDashboardHtml } from '../../views/pages/MainDashboard';
import { broadcast } from '../websocketServer';
import { GlobalCacheStatsCollector } from '../../globalCacheStatsCollector';

export async function broadcastUpdateGlobalDashboard(service: string): Promise<void> {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const keyStats = globalCacheStatsCollector.getKeyStatsRegistry().get(service) || new Map();
    const statsArray = Array.from(keyStats.values());
    const totalItems = statsArray.length;

    // Obtener el historial de llamadas
    const callHistory = await globalCacheStatsCollector.getAllServicesCallHistory();

    const allStats = globalCacheStatsCollector.getAllStats();

    const html = generateMainDashboardHtml(allStats, globalCacheStatsCollector.getKeyStatsRegistry());
    
    broadcast({
        type: 'UPDATE_GLOBAL_DASHBOARD',
        html,
        callHistory,
        memoryStats: Array.from(allStats.entries())
    });
}
