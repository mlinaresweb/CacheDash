export function generateLogsTableHtml(logs: { service: string, message: string, timestamp: Date }[]): string {
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

    return `
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
    `;
}
