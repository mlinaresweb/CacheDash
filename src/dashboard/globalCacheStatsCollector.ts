import express, { Request, Response } from 'express';
import { Server } from 'http';
import { CacheStats, KeyStats } from '../types/cache';
import { LocalCacheService } from '../local/localCacheService';
import { generateServiceListHtml } from './components/serviceList';
import { generateHtmlDashboard } from './components/dashboard';
import { generateChartsHtml } from './components/charts';
import { generateMemoryUsageHtml } from './components/generateMemoryUsageHtml';
import { generateMainDashboardHtml } from './components/generateMainDashboardHtml';
import { generateGlobalChartsHtml } from './components/generateGlobalSummaryHtml';
import { generateLogsHtml } from './components/generateLogsHtml';
import { logger } from './utils/loggerService';
import { broadcast } from './websocketServer';
import { RedisCacheService } from '../redis/redisCacheService'; 

export class GlobalCacheStatsCollector {
    private static instance: GlobalCacheStatsCollector;
    private statsRegistry: Map<string, CacheStats> = new Map();
    private keyStatsRegistry: Map<string, Map<string, KeyStats>> = new Map();
    private serviceRegistry: Map<string, LocalCacheService | RedisCacheService> = new Map();
    private monitoringEnabled = false;
    private app: express.Application;
    private server: Server | null = null;

    private constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        this.app.get('/cache-key-stats', this.handleCacheKeyStats.bind(this));
        this.app.post('/delete-key', this.handleDeleteKey.bind(this));
        this.app.post('/refresh-key', this.handleRefreshKey.bind(this));
        this.app.post('/flush-cache', this.handleFlushCache.bind(this));
        this.app.get('/export-key-stats', this.handleExportKeyStats.bind(this));
        this.app.get('/cache-key-stats/charts', this.handleCacheKeyStatsCharts.bind(this));
        this.app.get('/memory-usage', this.handleMemoryUsage.bind(this)); 
        this.app.get('/dashboard', this.handleMainDashboard.bind(this)); 
        this.app.get('/dashboard/estadisticas', this.handleGlobalStatsCharts.bind(this)); 
        this.app.get('/logs', this.handleLogs.bind(this));
        this.app.get('/all-services-call-history', this.handleAllServicesCallHistory.bind(this));
        this.app.post('/update-ttl', this.handleUpdateTtl.bind(this));
        this.app.get('/settings', this.handleSettingsPage.bind(this));
        this.app.post('/update-settings', this.handleUpdateSettings.bind(this));
    }

    public static getInstance(): GlobalCacheStatsCollector {
        if (!GlobalCacheStatsCollector.instance) {
            GlobalCacheStatsCollector.instance = new GlobalCacheStatsCollector();
        }
        return GlobalCacheStatsCollector.instance;
    }

    public enableMonitoring(port: number = 4000): void {
        if (!this.monitoringEnabled) {
            this.monitoringEnabled = true;
            this.server = this.app.listen(port, () => {
                console.log(`Monitoring server started on port ${port}`);
            });
        }
    }

    public disableMonitoring(): void {
        if (this.monitoringEnabled && this.server) {
            this.server.close(() => {
                console.log("Monitoring server stopped");
            });
            this.server = null;
            this.monitoringEnabled = false;
        }
    }

    public isMonitoringEnabled(): boolean {
        return this.monitoringEnabled;
    }

    public registerCacheService(identifier: string, stats: CacheStats, serviceInstance: LocalCacheService | RedisCacheService, maxMemorySizeMB?: number): void {
        console.log(`Registering service: ${identifier}, Max Memory: ${maxMemorySizeMB} MB`);
        this.statsRegistry.set(identifier, { ...stats, maxMemorySizeMB });
        this.serviceRegistry.set(identifier, serviceInstance);
    }

    public registerKeyStats(identifier: string, keyStats: Map<string, KeyStats>): void {
        this.keyStatsRegistry.set(identifier, keyStats);
    }

    public updateServiceStats(identifier: string, stats: CacheStats): void {
        const existingStats = this.statsRegistry.get(identifier);
        if (existingStats) {
            this.statsRegistry.set(identifier, { ...existingStats, ...stats });
        }
    }

    public async broadcastUpdate(): Promise<void> {
        const allStats = this.getAllStats();
        const html = generateServiceListHtml(allStats);
        broadcast({ type: 'UPDATE_VIEW', html });

        for (const service of this.serviceRegistry.keys()) {
            await this.broadcastUpdateDashboard(service);
        }
    }

    public async broadcastUpdateLogs(): Promise<void> {
        const logs = logger.getLogs();
        const services = Array.from(this.serviceRegistry.keys());
        const html = generateLogsHtml(logs, services, true, undefined, true);
        broadcast({ type: 'UPDATE_LOGS', html });
    }

    public async broadcastUpdateDashboard(service: string): Promise<void> {
        const keyStats = this.getKeyStatsRegistry().get(service) || new Map();
        const statsArray = Array.from(keyStats.values());
        const totalItems = statsArray.length;
        const html = generateHtmlDashboard(service, statsArray, totalItems);
        broadcast({ type: 'UPDATE_DASHBOARD', service, html });
    }

    public async broadcastUpdateGlobalDashboard(service: string): Promise<void> {
        const keyStats = this.getKeyStatsRegistry().get(service) || new Map();
        const statsArray = Array.from(keyStats.values());
        const totalItems = statsArray.length;
        const html = generateMainDashboardHtml(this.getAllStats(), this.getKeyStatsRegistry());
        broadcast({ type: 'UPDATE_GLOBAL_DASHBOARD', html });
    }

    public getAverageUncachedResponseTimes(): Map<string, number> {
        const averageUncachedResponseTimes = new Map<string, number>();
        this.keyStatsRegistry.forEach((keyStats, service) => {
            let totalResponseTime = 0;
            let setCount = 0;
            keyStats.forEach(stat => {
                totalResponseTime += stat.uncachedResponseTimes.reduce((a, b) => a + b, 0);
                setCount += stat.uncachedResponseTimes.length;
            });
            const averageUncachedResponseTime = setCount ? totalResponseTime / setCount : 0;
            averageUncachedResponseTimes.set(service, averageUncachedResponseTime);
        });
        return averageUncachedResponseTimes;
    }

    public getKeyUncachedResponseTimes(service?: string): { labels: string[], responseTimes: number[] } {
        let keyStats: Map<string, KeyStats>;
        if (service) {
            keyStats = this.keyStatsRegistry.get(service) || new Map();
        } else {
            keyStats = new Map();
            this.keyStatsRegistry.forEach(serviceKeyStats => {
                serviceKeyStats.forEach((stat, key) => {
                    if (keyStats.has(key)) {
                        const existingStat = keyStats.get(key)!;
                        existingStat.uncachedResponseTimes = existingStat.uncachedResponseTimes.concat(stat.uncachedResponseTimes);
                    } else {
                        keyStats.set(key, { ...stat });
                    }
                });
            });
        }
        const statsArray = Array.from(keyStats.values());
        statsArray.sort((a, b) => b.uncachedResponseTimes.length - a.uncachedResponseTimes.length);
        const topStats = statsArray.slice(0, 6);
        const labels = topStats.map(stat => stat.keyName);
        const responseTimes = topStats.map(stat => stat.uncachedResponseTimes.reduce((sum, time) => sum + time, 0) / stat.uncachedResponseTimes.length || 0);
        return { labels, responseTimes };
    }

    public getAverageResponseTimes(): Map<string, number> {
        const averageResponseTimes = new Map<string, number>();
        this.keyStatsRegistry.forEach((keyStats, service) => {
            let totalResponseTime = 0;
            let hitCount = 0;
            keyStats.forEach(stat => {
                totalResponseTime += stat.responseTimes.reduce((a, b) => a + b, 0);
                hitCount += stat.hits;
            });
            const averageResponseTime = hitCount ? totalResponseTime / hitCount : 0;
            averageResponseTimes.set(service, averageResponseTime);
        });
        return averageResponseTimes;
    }

    public getKeyResponseTimes(service?: string): { labels: string[], responseTimes: number[] } {
        let keyStats: Map<string, KeyStats>;
        if (service) {
            keyStats = this.keyStatsRegistry.get(service) || new Map();
        } else {
            keyStats = new Map();
            this.keyStatsRegistry.forEach(serviceKeyStats => {
                serviceKeyStats.forEach((stat, key) => {
                    if (keyStats.has(key)) {
                        const existingStat = keyStats.get(key)!;
                        existingStat.hits += stat.hits;
                        existingStat.responseTimes = existingStat.responseTimes.concat(stat.responseTimes);
                    } else {
                        keyStats.set(key, { ...stat });
                    }
                });
            });
        }
        const statsArray = Array.from(keyStats.values());
        statsArray.sort((a, b) => b.hits - a.hits);
        const topStats = statsArray.slice(0, 6);
        const labels = topStats.map(stat => stat.keyName);
        const responseTimes = topStats.map(stat => stat.responseTimes.reduce((sum, time) => sum + time, 0) / stat.responseTimes.length || 0);
        return { labels, responseTimes };
    }

    public getCacheRenewalRate(): Map<string, number> {
        const cacheRenewalRates = new Map<string, number>();
        this.statsRegistry.forEach((stats, service) => {
            const totalKeys = stats.keys;
            const totalAddedDeleted = stats.keysAdded + stats.keysDeleted;
            const renewalRate = totalKeys > 0 ? ((totalAddedDeleted) / (totalKeys + totalAddedDeleted)) * 100 : 0;
            cacheRenewalRates.set(service, renewalRate);
        });
        return cacheRenewalRates;
    }

    public getEvictionRate(): Map<string, number> {
        const evictionRates = new Map<string, number>();
        this.statsRegistry.forEach((stats, service) => {
            const totalKeys = stats.keys;
            const totalEvictions = stats.evictions;
            const evictionRate = totalKeys > 0 ? (totalEvictions / (totalKeys + totalEvictions)) * 100 : 0;
            evictionRates.set(service, evictionRate);
        });
        return evictionRates;
    }

    public incrementStats(identifier: string, incrementalStats: Partial<CacheStats>): void {
        if (this.monitoringEnabled) {
            let currentStats = this.statsRegistry.get(identifier) || { hits: 0, misses: 0, keys: 0, size: 0, keysAdded: 0, keysDeleted: 0, evictions: 0 };
            currentStats.hits = Math.max(0, currentStats.hits + (incrementalStats.hits || 0));
            currentStats.misses = Math.max(0, currentStats.misses + (incrementalStats.misses || 0));
            currentStats.size = Math.max(0, currentStats.size + (incrementalStats.size || 0));
            currentStats.keys = Math.max(0, currentStats.keys + (incrementalStats.keys || 0));
            currentStats.keysAdded = Math.max(0, currentStats.keysAdded + (incrementalStats.keysAdded || 0));
            currentStats.keysDeleted = Math.max(0, currentStats.keysDeleted + (incrementalStats.keysDeleted || 0));
            currentStats.evictions = Math.max(0, currentStats.evictions + (incrementalStats.evictions || 0));
            this.statsRegistry.set(identifier, currentStats);
        }
    }

    public decrementStats(identifier: string, decrementalStats: Partial<CacheStats>): void {
        if (this.monitoringEnabled) {
            let currentStats = this.statsRegistry.get(identifier) || { hits: 0, misses: 0, keys: 0, size: 0, keysAdded: 0, keysDeleted: 0, evictions: 0 };
            currentStats.hits = Math.max(0, currentStats.hits - (decrementalStats.hits || 0));
            currentStats.misses = Math.max(0, currentStats.misses - (decrementalStats.misses || 0));
            currentStats.size = Math.max(0, currentStats.size - (decrementalStats.size || 0));
            currentStats.keys = Math.max(0, currentStats.keys - (decrementalStats.keys || 0));
            currentStats.keysAdded = Math.max(0, currentStats.keysAdded - (decrementalStats.keysAdded || 0));
            currentStats.keysDeleted = Math.max(0, currentStats.keysDeleted + (decrementalStats.keysDeleted || 0));
            currentStats.evictions = Math.max(0, currentStats.evictions + (decrementalStats.evictions || 0));
            this.statsRegistry.set(identifier, currentStats);
        }
    }

    public getAllStats(): Map<string, CacheStats> {
        return this.statsRegistry;
    }

    public getService(identifier: string): LocalCacheService | RedisCacheService | undefined {
        return this.serviceRegistry.get(identifier);
    }

    public getKeyStatsRegistry(): Map<string, Map<string, KeyStats>> {
        return this.keyStatsRegistry;
    }

    public getKeyStatsForService(service: string, searchKey?: string, page: number = 1, limit: number = 10, sortBy: keyof KeyStats = 'keyName', order: 'asc' | 'desc' = 'asc'): { keyStats: KeyStats[], totalItems: number } {
        const keyStats = this.keyStatsRegistry.get(service);
        if (!keyStats) return { keyStats: [], totalItems: 0 };
        let statsArray = Array.from(keyStats.values());
        if (searchKey) {
            statsArray = statsArray.filter(stat => stat.keyName.includes(searchKey));
        }
        statsArray.sort((a, b) => {
            const aValue = a[sortBy] ?? '';
            const bValue = b[sortBy] ?? '';
            if (aValue < bValue) return order === 'asc' ? -1 : 1;
            if (aValue > bValue) return order === 'asc' ? 1 : -1;
            return 0;
        });
        const totalItems = statsArray.length;
        const start = (page - 1) * limit;
        const end = start + limit;
        return { keyStats: statsArray.slice(start, end), totalItems };
    }

    public generateCsv(keyStats: KeyStats[]): string {
        const header = 'Key,Hits,Misses,Set Time,End Time,TTL (seconds),Time Remaining (seconds),Size (bytes)\n';
        const rows = keyStats.map(stat => {
            const setTime = new Date(stat.setTime).toLocaleString();
            const endTime = new Date(stat.endTime || 0).toLocaleString();
            const timeRemaining = Math.max(0, Math.floor((stat.setTime + stat.ttl * 1000 - Date.now()) / 1000));
            return `${stat.keyName},${stat.hits},${stat.misses},${setTime},${endTime},${stat.ttl},${timeRemaining},${stat.size}`;
        }).join('\n');
        return header + rows;
    }

    private handleCacheKeyStats(req: Request, res: Response): void {
        if (!this.monitoringEnabled) {
            res.status(403).json({ error: "Monitoring is disabled." });
            return;
        }
        const service = req.query.service as string;
        const searchKey = req.query.searchKey as string;
        const sortBy = req.query.sortBy as keyof KeyStats || 'keyName';
        const order = req.query.order as 'asc' | 'desc' || 'asc';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        if (service) {
            const { keyStats, totalItems } = this.getKeyStatsForService(service, searchKey, page, limit, sortBy, order);
            const html = generateHtmlDashboard(service, keyStats, totalItems, searchKey, page, limit, sortBy, order);
            res.send(html);
        } else {
            const allStats = this.getAllStats();
            const html = generateServiceListHtml(allStats);
            res.send(html);
        }
    }

    private handleDeleteKey(req: Request, res: Response): void {
        const { service, key } = req.body;
        const cacheService = this.getService(service);
        if (cacheService) {
            cacheService.del(key)
                .then(() => {
                    res.json({ message: 'Key deleted successfully' });
                })
                .catch(() => res.status(500).json({ message: 'Failed to delete key' }));
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    }

    private handleRefreshKey(req: Request, res: Response): void {
        const { service, key } = req.body;
        const cacheService = this.getService(service);
        if (cacheService) {
            cacheService.get<any>(key)
                .then(data => {
                    if (data !== undefined) {
                        const keyStats = cacheService.getKeyStats().get(key);
                        const originalTTL = keyStats ? keyStats.ttl : undefined;
                        return cacheService.set(key, data, originalTTL, true);
                    } else {
                        res.status(404).json({ message: 'Key not found' });
                    }
                })
                .then(() => {
                    res.json({ message: 'Key refreshed successfully' });
                    return GlobalCacheStatsCollector.getInstance().broadcastUpdateDashboard(service);
                })
                .catch(() => res.status(500).json({ message: 'Failed to refresh key' }));
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    }

    private handleFlushCache(req: Request, res: Response): void {
        const { service } = req.body;
        const cacheService = this.getService(service);
        if (cacheService) {
            cacheService.flush()
                .then(() => {
                    res.json({ message: 'Cache flushed successfully' });
                })
                .catch(() => res.status(500).json({ message: 'Failed to flush cache' }));
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    }

    private handleExportKeyStats(req: Request, res: Response): void {
        const { service } = req.query;
        const keyStats = this.getKeyStatsRegistry().get(service as string);
        if (keyStats) {
            const csv = this.generateCsv(Array.from(keyStats.values()));
            res.header('Content-Type', 'text/csv');
            res.attachment(`${service}-key-stats.csv`);
            res.send(csv);
        } else {
            res.sendStatus(404);
        }
    }

    private handleCacheKeyStatsCharts(req: Request, res: Response): void {
        if (!this.monitoringEnabled) {
            res.status(403).json({ error: "Monitoring is disabled." });
            return;
        }
        const service = req.query.service as string;
        if (service) {
            const keyStats = this.getKeyStatsRegistry().get(service);
            if (!keyStats) {
                res.status(404).json({ error: "Service not found." });
                return;
            }
            let statsArray = Array.from(keyStats.values());
            const sortedByHits = statsArray.slice().sort((a, b) => b.hits - a.hits).slice(0, 6);
            const sortedBySize = statsArray.slice().sort((a, b) => b.size - a.size).slice(0, 6);
            const labelsHitsMisses = sortedByHits.map(stat => stat.keyName);
            const hits = sortedByHits.map(stat => stat.hits);
            const misses = sortedByHits.map(stat => stat.misses);
            const labelsSizes = sortedBySize.map(stat => stat.keyName);
            const sizes = sortedBySize.map(stat => stat.size / 1024);
            const totalStats = this.statsRegistry.get(service);
            const totalHits = totalStats?.hits || 0;
            const totalMisses = totalStats?.misses || 0;
            const totalKeys = totalStats?.keys || 0;
            const totalSize = totalStats?.size || 0;
            const averageResponseTime = this.getAverageResponseTimes().get(service) || 0;
            const uncachedAverageResponseTime = this.getAverageUncachedResponseTimes().get(service) || 0;
            const totalEvictions = totalStats?.evictions || 0;
            const keyResponseTimesData = this.getKeyResponseTimes(service);
            const keyResponseLabels = keyResponseTimesData.labels;
            const keyResponseTimes = keyResponseTimesData.responseTimes;
            const uncachedKeyResponseTimesData = this.getKeyUncachedResponseTimes(service);
            const uncachedKeyResponseLabels = uncachedKeyResponseTimesData.labels;
            const uncachedKeyResponseTimes = uncachedKeyResponseTimesData.responseTimes;
            const html = generateChartsHtml(service, labelsHitsMisses, hits, misses, sizes, totalHits, totalMisses, totalKeys, totalSize, averageResponseTime, uncachedAverageResponseTime, keyResponseTimes, keyResponseLabels, uncachedKeyResponseTimes, uncachedKeyResponseLabels, totalStats?.keysAdded || 0, totalStats?.keysDeleted || 0, totalEvictions);
            res.send(html);
        } else {
            res.status(400).json({ error: "Service parameter is required." });
        }
    }

    private handleGlobalStatsCharts(req: Request, res: Response): void {
        if (!this.monitoringEnabled) {
            res.status(403).json({ error: "Monitoring is disabled." });
            return;
        }
        const allStats = Array.from(this.statsRegistry.entries());
        const totalHits = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.hits, 0);
        const totalMisses = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.misses, 0);
        const totalKeys = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.keys, 0);
        const totalSize = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.size, 0);
        const totalKeysAdded = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.keysAdded, 0);
        const totalKeysDeleted = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.keysDeleted, 0);
        const totalEvictions = allStats.reduce((sum, [serviceIdentifier, stats]) => sum + stats.evictions, 0);
        const averageResponseTime = totalHits ? allStats.reduce((sum, [serviceIdentifier, stats]) => sum + (stats.hits * this.getAverageResponseTimes().get(serviceIdentifier)!), 0) / totalHits : 0;
        const uncachedAverageResponseTime = totalHits ? allStats.reduce((sum, [serviceIdentifier, stats]) => sum + (stats.hits * this.getAverageUncachedResponseTimes().get(serviceIdentifier)!), 0) / totalHits : 0;
        const labels: string[] = [];
        const hits: number[] = [];
        const misses: number[] = [];
        const sizes: number[] = [];
        this.keyStatsRegistry.forEach((keyStats, service) => {
            keyStats.forEach(stat => {
                labels.push(stat.keyName);
                hits.push(stat.hits);
                misses.push(stat.misses);
                sizes.push(stat.size / 1024);
            });
        });
        const keyResponseTimesData = this.getKeyResponseTimes();
        const keyResponseLabels = keyResponseTimesData.labels;
        const keyResponseTimes = keyResponseTimesData.responseTimes;
        const uncachedKeyResponseTimesData = this.getKeyUncachedResponseTimes();
        const uncachedKeyResponseLabels = uncachedKeyResponseTimesData.labels;
        const uncachedKeyResponseTimes = uncachedKeyResponseTimesData.responseTimes;
        const html = generateGlobalChartsHtml(labels, hits, misses, sizes, totalHits, totalMisses, totalKeys, totalSize, averageResponseTime, uncachedAverageResponseTime, keyResponseTimes, keyResponseLabels, uncachedKeyResponseTimes, uncachedKeyResponseLabels, totalKeysAdded, totalKeysDeleted, totalEvictions);
        res.send(html);
    }

    private handleLogs(req: Request, res: Response): void {
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
        const services = Array.from(this.serviceRegistry.keys());
        const html = generateLogsHtml(logs, services, !service, service);
        res.send(html);
    }

    private handleMemoryUsage(req: Request, res: Response): void {
        const allStats = this.getAllStats();
        const html = generateMemoryUsageHtml(allStats);
        res.send(html);
    }

    private handleMainDashboard(req: Request, res: Response): void {
        const allStats = this.getAllStats();
        const keyStatsRegistry = this.getKeyStatsRegistry();
        const html = generateMainDashboardHtml(allStats, keyStatsRegistry);
        res.send(html);
    }

    public getAllServicesCallHistory(): { [timestamp: string]: number } {
        const combinedCallHistory: { [timestamp: string]: number } = {};
        this.serviceRegistry.forEach((serviceInstance, serviceIdentifier) => {
            const callHistory = serviceInstance.getCallHistory();
            for (const [timestamp, count] of Object.entries(callHistory)) {
                if (!combinedCallHistory[timestamp]) {
                    combinedCallHistory[timestamp] = 0;
                }
                combinedCallHistory[timestamp] += count;
            }
        });
        return combinedCallHistory;
    }

    private async handleAllServicesCallHistory(req: Request, res: Response): Promise<void> {
        const callHistory = this.getAllServicesCallHistory();
        res.json(callHistory);
    }

    private handleUpdateTtl(req: Request, res: Response): void {
        const { service, key, ttl } = req.body;
        const cacheService = this.getService(service);
        const numericTTL = Number(ttl);
        if (isNaN(numericTTL)) {
            res.status(400).json({ message: 'TTL must be a number' });
            return;
        }
        if (cacheService) {
            cacheService.get<any>(key)
                .then(data => {
                    if (data !== undefined) {
                        return cacheService.set(key, data, numericTTL, true);
                    } else {
                        res.status(404).json({ message: 'Key not found' });
                    }
                })
                .then(() => {
                    res.json({ message: 'TTL updated successfully' });
                    return GlobalCacheStatsCollector.getInstance().broadcastUpdateDashboard(service);
                })
                .catch(() => res.status(500).json({ message: 'Failed to update TTL' }));
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    }

    private handleSettingsPage(req: Request, res: Response): void {
        let html = `<h1>Cache Service Settings</h1>`;
        this.serviceRegistry.forEach((service, identifier) => {
            const config = service.getConfig();
            html += `
                <h2>Service: ${identifier}</h2>
                <p>TTL: ${config.ttl}</p>
                <p>Max Memory Size: ${config.maxMemorySizeMB !== undefined ? config.maxMemorySizeMB.toFixed(2) : 'NO LIMIT'} MB</p>
                <div>
                    <label for="ttl-${identifier}">New TTL:</label>
                    <input type="number" id="ttl-${identifier}" step="1" />
                    <label for="maxMemorySize-${identifier}">New Max Memory Size (MB):</label>
                    <input type="number" id="maxMemorySize-${identifier}" step="0.01" />
                    <button onclick="updateSettings('${identifier}')">Update</button>
                </div>
            `;
        });
        html += `
            <script>
                function updateSettings(serviceIdentifier) {
                    const ttl = document.getElementById('ttl-' + serviceIdentifier).value;
                    const maxMemorySize = document.getElementById('maxMemorySize-' + serviceIdentifier).value;
                    
                    fetch('/update-settings', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ serviceIdentifier, ttl, maxMemorySize })
                    })
                    .then(response => response.text())
                    .then(data => alert(data))
                    .catch(error => console.error('Error:', error));
                }
            </script>
        `;
        res.send(html);
    }
    
    

    private handleUpdateSettings(req: Request, res: Response): void {
        const { serviceIdentifier, ttl, maxMemorySize } = req.body;
        const service = this.getService(serviceIdentifier);
        if (service) {
            const newMaxMemorySizeMB = maxMemorySize ? parseFloat(maxMemorySize) : undefined;
            if (newMaxMemorySizeMB !== undefined && (isNaN(newMaxMemorySizeMB) || newMaxMemorySizeMB <= 0)) {
                res.status(400).send('Invalid max memory size');
                return;
            }
            service.updateConfig(ttl ? parseInt(ttl) : undefined, newMaxMemorySizeMB);
            const updatedStats = service.getStats();
            this.statsRegistry.set(serviceIdentifier, updatedStats);
        
            res.send(`Updated settings for service: ${serviceIdentifier}`);
        } else {
            res.status(404).send('Service not found');
        }
    }
    
    
    
}