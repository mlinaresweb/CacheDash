import { CacheStats, KeyStats } from '../../types/cache';
import { generateSidebarHtml } from './sidebar';

function getSimplifiedKeyName(keyName: string): string {
    const parts = keyName.split('/');
    return parts[parts.length - 1] || keyName;
}

function generateKeysListHtml(keyStatsRegistry: Map<string, Map<string, KeyStats>>): string {
    type KeyInfo = {
        key: string;
        simplifiedKey: string;
        service: string;
        hits: number;
        misses: number;
        setTime: number;
        endTime: number;
        ttl: number;
        timeRemaining: number;
        size: number;
    };

    let keys: KeyInfo[] = [];
    keyStatsRegistry.forEach((serviceKeyStats, serviceIdentifier) => {
        serviceKeyStats.forEach((keyStat) => {
            keys.push({
                key: keyStat.keyName,
                simplifiedKey: getSimplifiedKeyName(keyStat.keyName),
                service: serviceIdentifier,
                hits: keyStat.hits || 0,
                misses: keyStat.misses || 0,
                setTime: keyStat.setTime || 0,
                endTime: keyStat.endTime || 0,
                ttl: keyStat.ttl || 0,
                timeRemaining: Math.max(0, Math.floor((keyStat.setTime + keyStat.ttl * 1000 - Date.now()) / 1000)),
                size: keyStat.size
            });
        });
    });

    keys.sort((a, b) => b.size - a.size);

    let rows = '';
    keys.forEach(key => {
        rows += `
            <tr>
                <td title="${key.key}">${key.simplifiedKey}</td>
                <td>${key.service}</td>
                <td>${key.hits}</td>
                <td>${key.misses}</td>
                <td>${new Date(key.setTime).toLocaleString()}</td>
                <td>${new Date(key.endTime).toLocaleString()}</td>
                <td>${key.ttl}</td>
                <td>${key.timeRemaining}</td>
                <td>${key.size}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="globalDeleteKey('${key.service}', '${key.key}')">Delete</button>
                    <button class="btn btn-primary btn-sm" onclick="globalRefreshKey('${key.service}', '${key.key}')">Refresh</button>
                    <button class="btn btn-secondary btn-sm" onclick="showTtlModal('${key.service}', '${key.key}', ${key.ttl})">Update TTL</button>
                </td>
            </tr>
        `;
    });
    

return `
    <div class="keys-section">
        <div class="keys-filters mb-3">
        <div class="row flex-nowrap flex-wrap flex-lg-row align-items-end">
        <div class="col-12 col-md-6 d-flex mb-2 mb-md-0" style="gap: 10px;">
            <select id="sort-by" class="form-select me-2" onchange="sortTable('keys-table')" aria-label="Sort by">
                <option value="size">Size</option>
                <option value="key">Key</option>
                <option value="service">Service</option>
                <option value="hits">Hits</option>
                <option value="misses">Misses</option>
                <option value="setTime">Set Time</option>
                <option value="endTime">End Time</option>
                <option value="ttl">TTL</option>
                <option value="timeRemaining">Time Remaining</option>
            </select>
            <select id="sort-direction" class="form-select" onchange="sortTable('keys-table')" aria-label="Sort direction">
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
            </select>
        </div>
        <div class="col-12 col-md-6 mb-2 mb-md-0">
            <input type="text" id="search-key" class="form-control" oninput="filterTable('keys-table')" placeholder="Search">
        </div>
        </div>
        </div>
        <div class="keys-list-container">
            <table id="keys-table" class="table table-striped">
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Service</th>
                        <th>Hits</th>
                        <th>Misses</th>
                        <th>Set Time</th>
                        <th>End Time</th>
                        <th>TTL</th>
                        <th>Time Remaining</th>
                        <th>Size</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    </div>
    <div class="global-actions mt-3">
        <button class="btn btn-danger" onclick="globalFlushCache()">Flush All Caches</button>
    </div>
    <!-- Modal for updating TTL -->
    <div class="modal fade" id="ttlModal" tabindex="-1" role="dialog" aria-labelledby="ttlModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="ttlModalLabel">Update TTL</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="ttlForm">
                        <div class="form-group">
                            <label for="newTtl">New TTL (seconds)</label>
                            <input type="number" class="form-control" id="newTtl" required>
                        </div>
                        <input type="hidden" id="modalService">
                        <input type="hidden" id="modalKey">
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="updateTtl()">Save changes</button>
                </div>
            </div>
        </div>
    </div>
    <script>
        const socket = new WebSocket('ws://localhost:8081');

        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.type === 'UPDATE_DASHBOARD') {
                updateDashboard();
            }
        };

        function updateDashboard() {
            fetch('/dashboard')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const newKeysSection = doc.querySelector('.keys-section');
                    const newCardsContainer = doc.querySelector('.container');

                    const oldKeysSection = document.querySelector('.keys-section');
                    const oldCardsContainer = document.querySelector('.container');

                    if (newKeysSection && oldKeysSection) {
                        oldKeysSection.innerHTML = newKeysSection.innerHTML;
                    }

                    if (newCardsContainer && oldCardsContainer) {
                        oldCardsContainer.innerHTML = newCardsContainer.innerHTML;
                    }
                });
        }

        function showAlert(message, type) {
            const alertPlaceholder = document.getElementById('alertPlaceholder');
            const wrapper = document.createElement('div');
            wrapper.innerHTML = [
                \`<div class="alert alert-\${type} alert-dismissible fade show" role="alert">\`,
                \`<div>\${message}</div>\`,
                \`<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>\`,
                '</div>'
            ].join('');

            alertPlaceholder.append(wrapper);

            setTimeout(() => {
                wrapper.classList.remove('show');
                wrapper.classList.add('hide');
                setTimeout(() => {
                    alertPlaceholder.removeChild(wrapper);
                }, 500); // Espera a que la animación termine
            }, 3000);
        }

        function globalDeleteKey(service, key) {
            fetch('/delete-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ service, key })
            })
            .then(response => response.json())
            .then(data => {
                showAlert(data.message, 'danger');
                if (data.message.includes('successfully')) {
                    updateDashboard();
                }
            })
            .catch(error => console.error('Error:', error));
        }

        function globalRefreshKey(service, key) {
            fetch('/refresh-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ service, key })
            })
            .then(response => response.json())
            .then(data => {
                showAlert(data.message, 'primary');
                if (data.message.includes('successfully')) {
                    updateDashboard();
                }
            })
            .catch(error => console.error('Error:', error));
        }

        function globalFlushCache() {
            fetch('/flush-cache', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ service: 'all' })
            })
            .then(response => response.json())
            .then(data => {
                showAlert(data.message, 'danger');
                if (data.message.includes('successfully')) {
                    updateDashboard();
                }
            })
            .catch(error => console.error('Error:', error));
        }

        function sortTable(tableId) {
            const table = document.getElementById(tableId).getElementsByTagName('tbody')[0];
            const rows = Array.from(table.getElementsByTagName('tr'));
            const sortBy = document.getElementById('sort-by').value;
            const sortDirection = document.getElementById('sort-direction').value;

            const getCellValue = (row, index) => row.children[index].innerText || row.children[index].textContent;

            const comparer = (idx, asc, isNumeric) => (a, b) => {
                const v1 = getCellValue(asc ? a : b, idx);
                const v2 = getCellValue(asc ? b : a, idx);
                if (isNumeric) {
                    return parseFloat(v1) - parseFloat(v2);
                } else {
                    return v1.localeCompare(v2);
                }
            };

            let columnIndex, isNumeric = false;
            switch (sortBy) {
                case 'key':
                    columnIndex = 0;
                    break;
                case 'service':
                    columnIndex = 1;
                    break;
                case 'hits':
                    columnIndex = 2;
                    isNumeric = true;
                    break;
                case 'misses':
                    columnIndex = 3;
                    isNumeric = true;
                    break;
                case 'setTime':
                    columnIndex = 4;
                    isNumeric = true;
                    break;
                case 'endTime':
                    columnIndex = 5;
                    isNumeric = true;
                    break;
                case 'ttl':
                    columnIndex = 6;
                    isNumeric = true;
                    break;
                case 'timeRemaining':
                    columnIndex = 7;
                    isNumeric = true;
                    break;
                case 'size':
                    columnIndex = 8;
                    isNumeric = true;
                    break;
            }

            const ascending = sortDirection === 'asc';
            rows.sort(comparer(columnIndex, ascending, isNumeric)).forEach(row => table.appendChild(row));
        }

        function filterTable(tableId) {
            const searchKey = document.getElementById('search-key').value.toLowerCase();
            const table = document.getElementById(tableId).getElementsByTagName('tbody')[0];
            const rows = Array.from(table.getElementsByTagName('tr'));

            rows.forEach(row => {
                const cells = Array.from(row.getElementsByTagName('td'));
                const match = cells.some(cell => cell.innerText.toLowerCase().includes(searchKey));
                row.style.display = match ? '' : 'none';
            });
        }

        function showTtlModal(service, key, ttl) {
            document.getElementById('modalService').value = service;
            document.getElementById('modalKey').value = key;
            document.getElementById('newTtl').value = ttl;
            $('#ttlModal').modal('show');
        }

        function updateTtl() {
            const service = document.getElementById('modalService').value;
            const key = document.getElementById('modalKey').value;
            const newTtl = parseInt(document.getElementById('newTtl').value, 10);

            if (isNaN(newTtl)) {
                showAlert('TTL must be a number.', 'danger');
                return;
            }

            fetch('/update-ttl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ service, key, ttl: newTtl })
            }).then(response => response.json())
            .then(data => {
                if (data.message === 'TTL updated successfully') {
                    showAlert('The TTL has been updated successfully.', 'success');
                    setTimeout(() => updateDashboard(), 3000);
                    $('#ttlModal').modal('hide');
                } else {
                    showAlert('Failed to update TTL.', 'danger');
                }
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
            sortTable('keys-table'); // Ordenar por tamaño por defecto al cargar la página
        });
    </script>
`;

}




export function generateMainDashboardHtml(statsRegistry: Map<string, CacheStats>, keyStatsRegistry: Map<string, Map<string, KeyStats>>): string {
    const sidebarHtml = generateSidebarHtml();
    const services = Array.from(statsRegistry.entries());
    let cards = '';

    services.forEach(([serviceIdentifier, stats]) => {
        const maxMemorySizeMB = stats.maxMemorySizeMB;
        const usedMemoryMB = stats.size / (1024 * 1024); // Convertir de bytes a MB
        let usagePercentage = 0;
        if (maxMemorySizeMB) {
            usagePercentage = (usedMemoryMB / maxMemorySizeMB) * 100;
        }
        let color = '#4caf50'; // Verde por defecto

        if (usagePercentage > 85) {
            color = '#f44336'; // Rojo
        } else if (usagePercentage > 60) {
            color = '#ff9800'; // Naranja
        }

        const maxMemoryText = maxMemorySizeMB !== undefined ? `${maxMemorySizeMB} MB` : 'NO LIMIT';

        cards += `
            <div class="card">
                <h2>${serviceIdentifier}</h2>
                <div class="circular-loader" style="--percentage: ${usagePercentage}; --color: ${color};">
                    <div class="circle">
                        <svg viewBox="0 0 36 36" class="circular-chart">
                            <path class="circle-bg"
                                  d="M18 2.0845
                                     a 15.9155 15.9155 0 0 1 0 31.831
                                     a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path class="circle-fg"
                                  d="M18 2.0845
                                     a 15.9155 15.9155 0 0 1 0 31.831
                                     a 15.9155 15.9155 0 0 1 0 -31.831"
                                  stroke-dasharray="${usagePercentage}, 100" />
                        </svg>
                        <span class="percentage">${usagePercentage.toFixed(2)}%</span>
                    </div>
                </div>
                <div class="memory-info">
                    <span>Used Memory: ${usedMemoryMB.toFixed(2)} MB</span>
                    <span>Max Memory: ${maxMemoryText}</span>
                </div>
            </div>
        `;
    });
    const keysListHtml = generateKeysListHtml(keyStatsRegistry);
    const allServicesCacheCallsChartHtml = generateAllServicesCacheCallsChartHtml(); // Gráfico combinado

    return `
        <html>
        <head>
            <title>Main Dashboard</title>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
            <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background-color: #f8f9fa;
                display: flex;
                margin: 0;
                padding: 0;
            }
            .content {
                margin-left: 290px; /* Ajuste por el ancho de la barra lateral */
                margin-right: 40px; /* Añadir margen derecho */
                padding: 20px;
                width: calc(100% - 330px); /* Ajuste para llenar el espacio restante */
            }
            h1 {
                margin-top: 20px;
            }
            .container-wrapper {
                display: flex;
                justify-content: space-between;
                flex-wrap: wrap;
            }
            .cards-container {
                display: flex;
                gap: 20px;
                overflow-x: auto; /* Desplazamiento horizontal */
                overflow-y: hidden; /* Evita el desplazamiento vertical */
                white-space: nowrap; /* Evita que las tarjetas se rompan en varias líneas */
                width: 62%%;
                padding-bottom: 10px; /* Espacio para evitar que el scroll horizontal cubra contenido */
              
            }
            .card {
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                padding: 20px;
                width: 250px; /* Ancho fijo para todas las tarjetas */
                height: 350px; /* Altura fija para todas las tarjetas */
                text-align: center;
                display: inline-block;
                vertical-align: top;
                flex-shrink: 0; /* Evita que las tarjetas se reduzcan */
            }
            .card h2 {
                white-space: normal;
                word-wrap: break-word;
            }
            .circular-loader {
                position: relative;
                width: 100px;
                height: 100px;
                margin: 0 auto;
            }
            .circle {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                position: relative;
            }
            .circular-chart {
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }
            .circle-bg {
                fill: none;
                stroke: #eee;
                stroke-width: 3.8;
            }
            .circle-fg {
                fill: none;
                stroke: var(--color);
                stroke-width: 3.8;
                stroke-linecap: round;
                transition: stroke-dasharray 0.3s ease;
            }
            .percentage {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.2em;
                color: var(--color);
                font-weight: bold;
            }
            .memory-info {
                margin-top: 10px;
            }
            .memory-info span {
                display: block;
                margin: 5px 0;
            }
            .chart-container {
               width:38%;
            }
            .chart {
                width: 100% !important; /* Asegura que el gráfico ocupe el ancho completo del contenedor */
                height: auto !important; /* Mantiene la relación de aspecto del gráfico */
            }
            .tables-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: space-between;
            }
            .keys-section {
                width: 100%;
                display: inline-block;
                vertical-align: top;
            }
            .keys-list-container {
                height: 300px; /* Altura fija para permitir el desplazamiento */
                overflow-y: auto; /* Habilitar desplazamiento vertical */
            }
            .keys-list-container table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
            }
            .keys-list-container th, .keys-list-container td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            .keys-list-container th {
                background-color: #f2f2f2;
            }
            select.form-select {
                height: 38px;
            }
            .global-actions {
                margin-top: 20px;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            @media (max-width: 1200px) {
                .cards-container, .chart-container {
                    width: 100%;
                }
            }
            @media (max-width: 768px) {
              
                .chart {
                    width: 100% !important;
                    height: auto !important;
                }
                .keys-filters .row {
                    flex-direction: column;
                }
                .keys-filters .col-12 {
                    width: 100%;
                }
                .keys-filters .col-12.col-md-3 {
                    display: flex;
                    flex-wrap: wrap;
                }
                .keys-filters .col-12.col-md-3 select {
                    flex: 1;
                    margin-bottom: 10px;
                }
                .keys-filters .col-12.col-md-3 select:first-child {
                    margin-right: 10px;
                }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            .alert.hide {
                animation: fadeOut 0.5s forwards;
            }
        </style>
        
        
        </head>
        <body>
        ${sidebarHtml}
        <div class="content">
            <a href="/dashboard/estadisticas" class="btn btn-secondary mb-4"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>

            <h1>Main Dashboard</h1>
            <div class="container-wrapper">
                <div class="cards-container">
                    ${cards}
                </div>
                <div class="chart-container">
                    ${allServicesCacheCallsChartHtml}
                </div>
            </div>
            <div class="tables-container">
                ${keysListHtml}
            </div>
        </div>
        <div id="alertPlaceholder" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;"></div>
        
        </body>
        </html>
    `;
}




function generateAllServicesCacheCallsChartHtml(): string {
    return `
        <div>
            <h2>Cache Calls Over Time for All Services</h2>
            <canvas id="allServicesCacheCallsChart" ></canvas>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
            <script>
                document.addEventListener('DOMContentLoaded', async function () {
                    const response = await fetch('/all-services-call-history');
                    const callHistory = await response.json();

                    const labels = Object.keys(callHistory);
                    const data = Object.values(callHistory);

                    const ctx = document.getElementById('allServicesCacheCallsChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Cache Calls Per Hour',
                                data: data,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                                fill: false
                            }]
                        },
                        options: {
                            scales: {
                                x: {
                                    type: 'time',
                                    time: {
                                        unit: 'hour'
                                    },
                                    title: {
                                        display: true,
                                        text: 'Time'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Calls'
                                    }
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Cache Calls Over Time for All Services'
                                }
                            }
                        }
                    });
                });
            </script>
        </div>
    `;
}
