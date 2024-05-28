import { generateSidebarHtml } from './sidebar';

export function generateLogsHtml(logs: { service: string, message: string, timestamp: Date }[], services: string[], isGlobal: boolean, currentService?: string, forTableOnly: boolean = false): string {
    const logRows = logs.map(log => {
        const formattedTimestamp = log.timestamp.toLocaleString();
        return `
            <tr>
                <td data-timestamp="${log.timestamp.toISOString()}">${formattedTimestamp}</td>
                <td>${log.service}</td>
                <td>${log.message}</td>
            </tr>
        `;
    }).join('');

    if (forTableOnly) {
        return logRows;
    }

    const sidebarHtml = generateSidebarHtml();

    const serviceFilter = isGlobal ? `
        <div class="form-group mr-2">
            <select class="form-control" id="serviceFilter" name="service" onchange="applyFilters()">
                <option value="">All Services</option>
                ${services.map(service => `<option value="${service}">${service}</option>`).join('')}
            </select>
        </div>
    ` : '';

    const backButton = currentService ? `
        <a href="/cache-key-stats?service=${currentService}" class="btn btn-secondary mb-4">
            <i class="fas fa-arrow-left"></i> Back to Dashboard
        </a>
    ` : '';

    return `
        <html>
        <head>
            <title>Cache Logs</title>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <style>
                body {
                    background-color: #f8f9fa;
                    display: flex;
                    margin: 0;
                    padding: 0;
                }
                .content {
                    margin-left: 290px;
                    margin-right: 40px;
                    padding: 20px;
                    width: calc(100% - 330px);
                }
                .table-container {
                    max-height: calc(100vh - 200px);
                    overflow-y: auto;
                    overflow-x: auto;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                }
                .table-container::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                }
                .table-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .table-container::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 6px;
                }
                .table-container::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            </style>
        </head>
        <body>
        ${sidebarHtml}
        <div class="content">
            <div class="">
                <h1 class="mt-5">Cache Logs</h1>
                ${backButton}
                <form class="form-inline mb-3" id="filterForm">
                    ${serviceFilter}
                    <div class="form-group mr-2">
                        <input type="datetime-local" class="form-control" id="startTimestamp" name="startTimestamp" onchange="applyFilters()" placeholder="Start Timestamp">
                    </div>
                    <div class="form-group mr-2">
                        <select class="form-control" id="messageType" name="messageType" onchange="applyFilters()">
                            <option value="">All Types</option>
                            <option value="set">Set</option>
                            <option value="hit">Hit</option>
                            <option value="miss">Miss</option>
                            <option value="delete">Delete</option>
                            <option value="flush">Flush</option>
                            <option value="expire">Expire</option>
                            <option value="error">Error</option>
                           
                        </select>
                    </div>
                    <div class="form-group mr-2">
                        <input type="text" class="form-control" id="search" name="search" placeholder="Search logs" oninput="applyFilters()">
                    </div>
                    <button type="button" class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
                </form>
                <div class="table-container">
                    <table class="table table-striped mt-3" id="logsTable">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Service</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <script>
            function applyFilters() {
                const startTimestamp = document.getElementById('startTimestamp').value;
                const messageType = document.getElementById('messageType').value.toLowerCase();
                const search = document.getElementById('search').value.toLowerCase();
                const serviceFilter = document.getElementById('serviceFilter');
                const service = serviceFilter ? serviceFilter.value : '';

                let rows = document.querySelectorAll('#logsTable tbody tr');
                rows.forEach(row => {
                    let show = true;
                    const cells = row.children;
                    const timestamp = new Date(cells[0].getAttribute('data-timestamp')).getTime();
                    const serviceCell = cells[1].innerText;
                    const message = cells[2].innerText.toLowerCase();

                    if (startTimestamp && timestamp < new Date(startTimestamp).getTime()) show = false;
                    if (messageType && !message.includes(messageType)) show = false;
                    if (search && !message.includes(search)) show = false;
                    if (service && service !== serviceCell) show = false;

                    row.style.display = show ? '' : 'none';
                });
            }

            function clearFilters() {
                document.getElementById('filterForm').reset();
                applyFilters();
            }

            const socket = new WebSocket('ws://localhost:8081');
            socket.addEventListener('message', function (event) {
                const data = JSON.parse(event.data);
                if (data.type === 'UPDATE_LOGS') {
                    const logsTableBody = document.querySelector('#logsTable tbody');
                    logsTableBody.innerHTML = data.html;
                    applyFilters();
                }
            });
        </script>
        </body>
        </html>
    `;
}
