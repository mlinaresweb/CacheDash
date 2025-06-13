import { LocalCacheService } from '../../local/localCacheService';
import { RedisCacheService } from '../../redis/redisCacheService';

export function generateCacheServiceSettingsHtml(service: LocalCacheService | RedisCacheService, identifier: string): string {
    const config = service.getConfig();
    return `
    <div class="settings-wrapper">
        <h2 class="settings-h2" style="color: #cdcdcd; font-size: 1.5rem; margin-bottom: 20px;">${identifier}</h2>
       
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;    ">
            <div style="flex: 0 0 48%; max-width: 48%; background-color: #2b2b2b; border-radius: 8px; border: 1px solid #454545; box-shadow: 0 6px 10px rgba(0,0,0,0.1); padding: 10px;">
                <div style="color: #cdcdcd;">
                    <h6 style="margin-bottom: 10px;">TTL</h6>
                    <p style="font-size: 1rem;margin: 0;font-weight: 600;color: white !important;">${config.ttl}</p>
                </div>
            </div>
            <div style="flex: 0 0 48%; max-width: 48%; background-color: #2b2b2b; border-radius: 8px; border: 1px solid #454545; box-shadow: 0 6px 10px rgba(0,0,0,0.1); padding: 10px;">
                <div style="color: #cdcdcd;">
                    <h6 style="margin-bottom: 10px;">Max Memory Size</h6>
                    <p style="font-size: 1rem;margin: 0;font-weight: 600;color: white !important;">${config.maxMemorySizeMB !== undefined ? config.maxMemorySizeMB.toFixed(2) : 'NO LIMIT'} MB</p>
                </div>
            </div>
        </div>
        <div>
            <label for="ttl-${identifier}" style="display: block; margin-top: 10px; color: #cdcdcd;">New TTL:</label>
            <input type="number" id="ttl-${identifier}" data-testid="refresh-rate" step="1" style="width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 10px; background-color: #2b2b2b; border: 1px solid #454545; color: #cdcdcd;" />
            <label for="maxMemorySize-${identifier}" style="display: block; margin-top: 10px; color: #cdcdcd;">New Max Memory Size (MB):</label>
            <input type="number" id="maxMemorySize-${identifier}" step="0.01" style="width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 10px; background-color: #2b2b2b; border: 1px solid #454545; color: #cdcdcd;" />
            <button data-testid="submit-settings" onclick="updateSettings('${identifier}')" style="
                padding: 8px 16px;
                background-color: #ffc107;
                border: none;
                color: #282828 !important;
                cursor: pointer;
                border: 1px solid #ffc107;
                border-radius: 4px;
                margin-left: 4px;
                margin-top: 10px;
            ">Update</button>
        </div>
        </div>
    `;
}
