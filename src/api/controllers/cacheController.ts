import { Request, Response } from 'express';
import { CacheServiceCreate } from '../../cacheServiceCreate';

// Instanciar el servicio de caché
const cacheService = CacheServiceCreate.create({ cacheType: 'local', defaultTTL: 60, enableMonitoring: true, serviceIdentifier: 'STATIC_DATA_SERVICE_REDIS' });

export const addKey = async (req: Request, res: Response): Promise<void> => {
    const { key, value, ttl } = req.body;

    try {
        await cacheService.set(key, value, ttl);
        res.json({ message: 'Key added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add key' });
    }
};

export const getKey = async (req: Request, res: Response): Promise<void> => {
    const { key } = req.query;

    try {
        const value = await cacheService.get(key as string);
        if (value === undefined) {
            res.status(404).json({ message: 'Key not found' });
        } else {
            res.json({ key, value });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to get key' });
    }
};
