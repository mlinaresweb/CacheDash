import { CacheStats } from '../../../types/cache';
import { generateServiceListComponentHtml } from '../../components/serviceList/ServiceList';

export function generateServiceListViewHtml(allStats: Map<string, CacheStats>): string {
    const serviceListHtml = generateServiceListComponentHtml(allStats);

    return `
    <html>
    <head>
        <script>
            const socket = new WebSocket('ws://localhost:8081');

            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                console.log('Received:', data);

                if (data.type === 'UPDATE_VIEW') {
                    updateServiceList();
                }
            };

            function updateServiceList() {
                fetch('/cache-key-stats')
                    .then(response => response.text())
                    .then(html => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        const newServiceList = tempDiv.querySelector('#service-list');
                        if (newServiceList) {
                            const oldServiceList = document.getElementById('service-list');
                            if (oldServiceList) {
                                oldServiceList.innerHTML = newServiceList.innerHTML;
                            }
                        }
                    });
            }
        </script>
    </head>
            <div class="">
                <h1 class="mb-4">Cache Services <span class="yellow-cache">Dashboard</span></h1>
                <div id="service-list" class="row row-servicelist">
                    ${serviceListHtml}
                </div>
            </div>
    </html>
    `;
}
