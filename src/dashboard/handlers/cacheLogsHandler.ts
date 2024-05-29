// src/handlers/cacheLogsHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { logger } from '../utils/loggerService';
import { generateLogsHtml } from '../components/generateLogsHtml';

export function handleLogs(req: Request, res: Response): void {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const service = req.query.service as string;
    const startTimestamp = req.query.startTimestamp ? new Date(req.query.startTimestamp as string) : null;
    const messageType = req.query.messageType as string;
    const search = req.query.search as string;
    let logs = logger.getLogs(service);
    if (startTimestamp) {
        logs = logs.filter(log => log.timestamp >= startTimestamp);
    }
    if (messageType) {
        logs = logs.filter(log => log.message.toLowerCase().includes(messageType.toLowerCase()));
    }
    if (search) {
        logs = logs.filter(log => log.message.toLowerCase().includes(search.toLowerCase()));
    }
    const services = Array.from(globalCacheStatsCollector.getServiceRegistryKeys());
    const html = generateLogsHtml(logs, services, !service, service);
    res.send(html);
}
