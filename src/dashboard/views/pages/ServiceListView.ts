import { CacheStats } from '../../../types/cache';
import { generateServiceListComponentHtml } from '../../components/serviceList/ServiceList';

export function generateServiceListViewHtml(allStats: Map<string, CacheStats>): string {
    const serviceListHtml = generateServiceListComponentHtml(allStats);

    return `
    <html>
    <head>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
        <style>
            .service-card { 
                margin-bottom: 20px; 
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); 
                border-radius: 10px; 
                transition: transform 0.2s; 
                background-color: #fff;
                border: none;
            }
            .service-card:hover { 
                transform: scale(1.05); 
            }
            .service-card .card-body { 
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                align-items: center; 
                padding: 20px;
                text-align: center;
            }
            .service-card .service-info { 
                margin-bottom: 10px; 
                width: 100%; 
            }
            .service-card .service-info h5 { 
                margin-bottom: 15px; 
                color: #343a40; 
                font-size: 1.25rem;
            }
            .service-card .service-info .stats { 
                display: flex; 
                flex-wrap: wrap; 
                justify-content: center;
                gap: 10px; 
            }
            .service-card .service-info .stats .stat { 
                display: flex; 
                align-items: center; 
                gap: 5px; 
                font-size: 0.9rem; 
                color: #6c757d; 
                background: #f1f1f1; 
                padding: 5px 10px; 
                border-radius: 5px; 
            }
            .service-card .btn { 
                margin-top: 10px; 
                font-size: 0.9rem; 
            }
            .container { 
                max-width: 1200px; 
                margin: auto; 
            }
            .row { 
                display: flex; 
                flex-wrap: wrap; 
                gap: 20px; 
            }
            .col-md-4 { 
                flex: 1; 
                min-width: 300px; 
                max-width: 300px; 
            }
        </style>
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
                <h1 class="mb-4">Cache Services Dashboard</h1>
                <div id="service-list" class="row">
                    ${serviceListHtml}
                </div>
            </div>
    </html>
    `;
}
