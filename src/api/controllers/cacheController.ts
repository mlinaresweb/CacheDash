import { Request, Response } from 'express';
import { CacheServiceCreate } from '../../cacheServiceCreate';

// Instanciar el servicio de caché
const cacheService = CacheServiceCreate.create({ cacheType: 'local', defaultTTL: 60, enableMonitoring: true, serviceIdentifier: 'STATIC_DATA_SERVICE_REDIS', maxMemorySizeMB:200 });

export const addKey = async (req: Request, res: Response): Promise<void> => {
    const { key, sizeMB, ttl } = req.body;

    try {
        // Generar un valor grande (por ejemplo, un string repetido)
        const sizeInBytes = sizeMB * 1024 * 1024;
        const value = 'A'.repeat(sizeInBytes);

        await cacheService.set(key, value, ttl);
        res.json({ message: 'Key added successfully' });
    } catch (error:any) {
        res.status(500).json({ message: 'Failed to add key', error: error.message });
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
    } catch (error:any) {
        res.status(500).json({ message: 'Failed to get key', error: error.message });
    }
};
