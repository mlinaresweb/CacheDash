// src/routes/routes.ts
import { Router } from 'express';
import * as handlers from '../handlers';
import { layoutMiddleware } from '../middleware/layoutMiddleware';

export function configureRoutes(): Router {
    const router = Router();

    router.use(layoutMiddleware);

    router.get('/cache-key-stats', handlers.handleCacheKeyStats);
    router.post('/delete-key', handlers.handleDeleteKey);
    router.post('/refresh-key', handlers.handleRefreshKey);
    router.post('/flush-cache', handlers.handleFlushCache);
    router.get('/export-key-stats', handlers.handleExportKeyStats);
    router.get('/cache-key-stats/charts', handlers.handleCacheKeyStatsCharts);
    router.get('/memory-usage', handlers.handleMemoryUsage); 
    router.get('/dashboard', handlers.handleMainDashboard); 
    router.get('/dashboard/estadisticas', handlers.handleGlobalStatsCharts); 
    router.get('/logs', handlers.handleLogs);
    router.get('/all-services-call-history', handlers.handleAllServicesCallHistory);
    router.post('/update-ttl', handlers.handleUpdateTtl);
    router.get('/settings', handlers.handleSettingsPage);
    router.post('/update-settings', handlers.handleUpdateSettings);

    return router;
}
