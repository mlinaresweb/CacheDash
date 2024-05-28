import { CacheStats } from '../../types/cache';
import { generateSidebarHtml } from './sidebar';

export function generateServiceListHtml(allStats: Map<string, CacheStats>): string {
    const sidebarHtml = generateSidebarHtml();

    let html = `
    <html>
    <head>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8f9fa;
                display: flex;
                margin: 0;
                padding: 0;
            }
            .content {
                margin-left: 290px; /* Adjusting for sidebar width plus some spacing */
                margin-right: 40px; /* Adding right margin */
                padding: 20px;
                width: calc(100% - 330px); /* Adjusting width to fill the remaining space */
            }
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
    <body>
        ${sidebarHtml}
        <div class="content">
            <div class="">
                <h1 class="mb-4">Cache Services Dashboard</h1>
                <div id="service-list" class="row">
    `;

    for (const [service, stats] of allStats) {
        const sizeInKB = (stats.size / 1024).toFixed(2); // Convert bytes to KB and format to 2 decimal places
        html += `
            <div class="col-md-4">
                <div class="card service-card">
                    <div class="card-body">
                        <div class="service-info">
                            <h5><i class="fas fa-database"></i> ${service}</h5>
                            <div class="stats">
                                <div class="stat"><i class="fas fa-check-circle"></i> Hits: ${stats.hits}</div>
                                <div class="stat"><i class="fas fa-times-circle"></i> Misses: ${stats.misses}</div>
                                <div class="stat"><i class="fas fa-key"></i> Keys: ${stats.keys}</div>
                                <div class="stat"><i class="fas fa-database"></i> Size: ${sizeInKB} KB</div>
                            </div>
                        </div>
                        <a href="/cache-key-stats?service=${service}" class="btn btn-primary">Details</a>
                    </div>
                </div>
            </div>
        `;
    }

    html += `
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return html;
}
