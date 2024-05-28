import { CacheStats } from '../../types/cache';

export function generateMemoryUsageHtml(statsRegistry: Map<string, CacheStats>): string {
    const services = Array.from(statsRegistry.entries());
    let rows = '';

    services.forEach(([serviceIdentifier, stats]) => {
        rows += `
            <tr>
                <td>${serviceIdentifier}</td>
                <td>${stats.maxMemorySizeMB ? stats.maxMemorySizeMB + ' MB' : 'No limit'}</td>
            </tr>
        `;
    });

    return `
        <html>
        <head>
            <title>Memory Usage</title>
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h1>Memory Usage for All Services</h1>
            <table>
                <tr>
                    <th>Service</th>
                    <th>Max Memory Size</th>
                </tr>
                ${rows}
            </table>
        </body>
        </html>
    `;
}
