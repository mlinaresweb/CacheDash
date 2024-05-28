// example/fetchQueues.ts
import axios from 'axios';
import { CacheServiceCreate } from '../src/index';

async function fetchAndCacheData() {
    const cacheService = CacheServiceCreate.create({ cacheType: 'local', defaultTTL: 60 , enableMonitoring: true, });
    const url = 'https://static.developer.riotgames.com/docs/lol/queues.json';
    const cacheKey = 'QUEUES_DATA';

    // Verificar si el dato está en la caché
    const cachedData = await cacheService.get<string>(cacheKey);
    if (cachedData) {
        console.log(`Cache hit for ${url}:`, JSON.parse(cachedData));
        return JSON.parse(cachedData);
    }

    // Si no está en la caché, hacer una solicitud HTTP
    const response = await axios.get(url);
    const data = response.data;

    // Almacenar el dato en la caché
    await cacheService.set(cacheKey, JSON.stringify(data));
    console.log(`Data fetched and cached for ${url}:`, data);
    return data;
}

fetchAndCacheData().catch(console.error);
