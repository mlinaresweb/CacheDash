// src/webSockets/broadcasts/broadcastUpdateLogs.ts
import { generateLogsHtml } from '../../views/pages/LogsView';
import { broadcast } from '../websocketServer';
import { GlobalCacheStatsCollector } from '../../globalCacheStatsCollector';
import { logger } from '../../utils/loggerService';

export async function broadcastUpdateLogs(): Promise<void> {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const logs = logger.getLogs();
    const services = Array.from(globalCacheStatsCollector.getServiceRegistry().keys());
    const html = generateLogsHtml(logs, services, true, undefined, true);
    broadcast({ type: 'UPDATE_LOGS', html });
}
