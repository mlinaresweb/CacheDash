// src/dashboard/handlers/ttlUpdateHandler.ts
import { Request, Response } from 'express';
import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';

// src/dashboard/handlers/ttlUpdateHandler.ts
export async function handleUpdateTtl(
  req: Request,
  res: Response
): Promise<void> {
  const { service, key, ttl } = req.body as {
    service?: string;
    key?: string;
    ttl?: unknown;
  };

  if (!service) {
    res.status(400).json({ message: 'El parámetro "service" es obligatorio' });
    return;
  }
  if (!key) {
    res.status(400).json({ message: 'El parámetro "key" es obligatorio' });
    return;
  }

  const numericTTL = Number(ttl);
  if (isNaN(numericTTL)) {
    // Mensaje para tests de “no numérico”
    res.status(400).json({ message: 'TTL must be a number' });
    return;
  }
  if (numericTTL < 0) {
    // En caso de negativo
    res.status(400).json({ message: 'TTL must be a non-negative number' });
    return;
  }

  const globalCollector = GlobalCacheStatsCollector.getInstance();
  const cacheService = globalCollector.getService(service);
  if (!cacheService) {
    res.status(404).json({ message: `Service "${service}" not found` });
    return;
  }

  try {
    const data = await cacheService.get<any>(key);
    if (data === undefined) {
      res
        .status(404)
        .json({ message: `Key "${key}" not found in service "${service}"` });
      return;
    }

    await cacheService.set(key, data, numericTTL, true);
    await globalCollector.broadcastUpdateDashboard(service);

    res.status(200).json({ message: 'TTL updated successfully' });
    return;

  } catch (error: any) {
    console.error(
      `[handleUpdateTtl] Error updating TTL for ${service}/${key}:`,
      error
    );
    res
      .status(500)
      .json({ message: 'Failed to update TTL', error: error.message });
    return;
  }
}
