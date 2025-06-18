// src/dashboard/handlers/cacheKeyStatsHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';
import { KeyStats } from '../../types/cache';
import { generateServiceListViewHtml } from '../views/pages/ServiceListView';
import { generateKeyStatsViewHtml }    from '../views/pages/KeyStatsView';
import { generateLayoutHtml }          from '../views/layout';

export function handleCacheKeyStats(req: Request, res: Response): void {
  const global = GlobalCacheStatsCollector.getInstance();

  if (!global.isMonitoringEnabled()) {
    res.status(403).json({ error: 'Monitoring is disabled.' });
    return;
  }

  const service   = req.query.service   as string | undefined;
  const searchKey = req.query.searchKey as string | undefined;
  const sortBy    = (req.query.sortBy   as keyof KeyStats) || 'keyName';
  const order     = (req.query.order    as 'asc' | 'desc')   || 'asc';
  const page      = parseInt(req.query.page as string)       || 1;
  const limit     = parseInt(req.query.limit as string)      || 10;

  if (service) {
    // Obtiene estadísticas filtradas y paginadas
    const { keyStats, totalItems } = global.getKeyStatsForService(
      service, searchKey, page, limit, sortBy, order
    );
    const viewHtml = generateKeyStatsViewHtml(
      service, keyStats, totalItems,
      searchKey, page, limit, sortBy, order
    );
    const html = generateLayoutHtml(viewHtml);

    res.send(html);
    return;
  }

  // Si no se especifica servicio, devuelve la lista de todos
  const allStats = global.getAllStats();
  const listView = generateServiceListViewHtml(allStats);
  const html     = generateLayoutHtml(listView);

  res.send(html);
  return;
}
