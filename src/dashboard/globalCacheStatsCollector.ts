import express, { Request, Response } from 'express';
import { Server } from 'http';
import { CacheStats, KeyStats } from '../types/cache';
import { LocalCacheService } from '../local/localCacheService';
import { RedisCacheService } from '../redis/redisCacheService'; 
import path from 'path';

import * as broadcasts from './webSockets/broadcasts'; 
import { configureRoutes } from './routes/dashboardRoutes';
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
        this.app.use(express.static(path.join(__dirname, '../public')));

        this.app.use(configureRoutes());  
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
    public getServiceRegistryKeys(): string[] {
        return Array.from(this.serviceRegistry.keys());
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
    
    public getServiceRegistry(): Map<string, LocalCacheService | RedisCacheService> {
        return this.serviceRegistry;
    }
    public getStatsRegistry(): Map<string, CacheStats> {
        return this.statsRegistry;
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
    public async broadcastUpdate(): Promise<void> {
        await broadcasts.broadcastUpdate();
    }

    public async broadcastUpdateLogs(): Promise<void> {
        await broadcasts.broadcastUpdateLogs();
    }

    public async broadcastUpdateDashboard(service: string): Promise<void> {
        await broadcasts.broadcastUpdateDashboard(service);
    }

    public async broadcastUpdateGlobalDashboard(service: string): Promise<void> {
        await broadcasts.broadcastUpdateGlobalDashboard(service);
    }

    public async broadcastUpdateGlobalStats(): Promise<void> {
        await broadcasts.broadcastUpdateGlobalStats();
    }
    public async broadcastUpdateServiceStats(service: string): Promise<void> {
        await broadcasts.broadcastUpdateServiceStats(service);
    }
}