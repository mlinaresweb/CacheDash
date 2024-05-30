import { LocalCacheService } from '../../../local/localCacheService';
import { RedisCacheService } from '../../../redis/redisCacheService';
import { generateCacheServiceSettingsHtml } from '../../components/cacheServiceSettings';

export function generateSettingsPageHtml(serviceRegistry: Map<string, LocalCacheService | RedisCacheService>): string {
    let html = `
        <h1>Cache Service Settings</h1>
        ${Array.from(serviceRegistry.entries()).map(([identifier, service]) => generateCacheServiceSettingsHtml(service, identifier)).join('')}
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
