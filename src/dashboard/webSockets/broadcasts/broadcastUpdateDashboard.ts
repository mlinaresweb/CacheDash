// src/webSockets/broadcasts/broadcastUpdateDashboard.ts
import { broadcast } from '../websocketServer';
import { GlobalCacheStatsCollector } from '../../globalCacheStatsCollector';
import { generateKeyStatsViewHtml } from '../../views/pages/KeyStatsView';

export async function broadcastUpdateDashboard(service: string): Promise<void> {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const keyStats = globalCacheStatsCollector.getKeyStatsRegistry().get(service) || new Map();
    const statsArray = Array.from(keyStats.values());
    const totalItems = statsArray.length;
    const html = generateKeyStatsViewHtml(service, statsArray, totalItems);
    broadcast({ type: 'UPDATE_DASHBOARD', service, html });
}
