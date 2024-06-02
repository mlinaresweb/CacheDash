import { LocalCacheService } from '../../local/localCacheService';
import { RedisCacheService } from '../../redis/redisCacheService';

export function generateCacheServiceSettingsHtml(service: LocalCacheService | RedisCacheService, identifier: string): string {
    const config = service.getConfig();
    return `
        <h2 class="settings-h2">Service: ${identifier}</h2>
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
}
