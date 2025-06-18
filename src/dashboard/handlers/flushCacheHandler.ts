// src/dashboard/handlers/flushCacheHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';

export async function handleFlushCache(
  req: Request,
  res: Response
): Promise<void> {
  const globalCollector = GlobalCacheStatsCollector.getInstance();
  const { service } = req.body as { service?: string };

  // ── Caso “flush all” ───────────────────────────────────────
  if (service === 'all') {
    // Consigo el listado de servicios registrados
    const allServices = globalCollector.getServiceRegistryKeys(); 
    try {
      // Llamo .flush() en paralelo a todos
      await Promise.all(
        allServices.map(name => {
          const svc = globalCollector.getService(name);
          return svc ? svc.flush() : Promise.resolve();
        })
      );
      // Opcional: notificar a todos los clientes que actualicen dashboards
      await globalCollector.broadcastUpdate(); 

      res.json({ message: 'All caches flushed successfully' });
      return;
    } catch (err) {
      console.error('Error flushing all caches:', err);
      res.status(500).json({ message: 'Failed to flush all caches' });
      return;
    }
  }

  // ── Caso “flush de un servicio concreto” ─────────────────────
  if (!service) {
    res.status(400).json({ message: 'Service is required' });
    return;
  }
  const cacheService = globalCollector.getService(service);
  if (!cacheService) {
    res.status(404).json({ message: `Service "${service}" not found` });
    return;
  }

  try {
    await cacheService.flush();
    // Notifico sólo a los clientes del dashboard de ese servicio
    await globalCollector.broadcastUpdateDashboard(service);

    res.json({ message: 'Cache flushed successfully' });
    return;
  } catch (err) {
    console.error(`Error flushing cache for service ${service}:`, err);
    res.status(500).json({ message: 'Failed to flush cache' });
    return;
  }
}
