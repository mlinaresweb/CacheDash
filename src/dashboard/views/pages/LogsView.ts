import { generateFiltersHtml } from '../../components/logs/Filters';
import { generateLogsTableHtml } from '../../components/logs/LogsTable';

export function generateLogsHtml(
    logs: { service: string, message: string, timestamp: Date }[], 
    services: string[], 
    isGlobal: boolean, 
    currentService?: string, 
    forTableOnly: boolean = false
): string {
    const logsTableHtml = generateLogsTableHtml(logs);

    if (forTableOnly) {
        return logsTableHtml;
    }

    const filtersHtml = generateFiltersHtml(services, isGlobal, currentService);

    return `
        <html>
        <head>
            <title>Cache Logs</title>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
        </head>
       
                <div class="">
                    <h1 class="">Cache Logs</h1>
                    ${filtersHtml}
                    ${logsTableHtml}
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
       
        </html>
    `;
}