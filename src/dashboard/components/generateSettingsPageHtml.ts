// src/components/generateSettingsPageHtml.ts
import { LocalCacheService } from '../../local/localCacheService';
import { RedisCacheService } from '../../redis/redisCacheService';

export function generateSettingsPageHtml(serviceRegistry: Map<string, LocalCacheService | RedisCacheService>): string {
    let html = `<h1>Cache Service Settings</h1>`;
    serviceRegistry.forEach((service, identifier) => {
        const config = service.getConfig();
        html += `
            <h2>Service: ${identifier}</h2>
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
    });
    html += `
        <script>
            function updateSettings(serviceIdentifier) {
                const ttl = document.getElementById('ttl-' + serviceIdentifier).value;
                const maxMemorySize = document.getElementById('maxMemorySize-' + serviceIdentifier).value;
                
                fetch('/update-settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ serviceIdentifier, ttl, maxMemorySize })
                })
                .then(response => response.text())
                .then(data => alert(data))
                .catch(error => console.error('Error:', error));
            }
        </script>
    `;
    return html;
}
