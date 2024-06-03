import { generateSummaryHtml } from '../../components/statistics/Summary';
import { generateRatiosHtml } from '../../components/statistics/Ratios';
import { generateChartsHtml } from '../../components/statistics/Charts';

export function generateStatisticsGlobalViewHtml(
    service: string, 
    labels: string[], 
    hits: number[], 
    misses: number[], 
    sizes: number[], 
    totalHits: number, 
    totalMisses: number, 
    totalKeys: number, 
    totalSize: number, 
    averageResponseTime: number, 
    uncachedAverageResponseTime: number, 
    keyResponseTimes: number[], 
    keyResponseLabels: string[], 
    uncachedKeyResponseTimes: number[], 
    uncachedKeyResponseLabels: string[], 
    totalKeysAdded: number, 
    totalKeysDeleted: number, 
    totalEvictions: number
): string {
    const summaryHtml = generateSummaryHtml(service, totalHits, totalMisses, totalKeys, totalSize, averageResponseTime, uncachedAverageResponseTime);
    const ratiosHtml = generateRatiosHtml(service, totalHits, totalMisses, totalKeysAdded, totalKeysDeleted, totalKeys, totalEvictions);
    const chartsHtml = generateChartsHtml(labels, hits, misses, sizes, averageResponseTime, keyResponseTimes, keyResponseLabels, uncachedKeyResponseTimes, uncachedKeyResponseLabels);

    return `
    <a href="/dashboard" class="btn btn-secondary mb-4"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
    <div class="summary-wrapper">
        ${summaryHtml}
        ${ratiosHtml}
    </div>
    <h2 class="title">${service} - Statistics</h2>
    ${chartsHtml}

    <script>
    document.addEventListener('DOMContentLoaded', function () {
        const socket = new WebSocket('ws://localhost:8081');
        
        socket.addEventListener('message', function (event) {
            const data = JSON.parse(event.data);
            
            if (data.type === 'UPDATE_GLOBAL_STATISTICS') {
                updateStatistics(data.html);
                updateCharts(data);
            }
        });
    });
    
    function updateStatistics(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
    
        // Update summary
        const summaryWrapper = document.querySelector('.summary-wrapper');
        const newSummaryWrapper = doc.querySelector('.summary-wrapper');
        if (summaryWrapper && newSummaryWrapper) {
            summaryWrapper.innerHTML = newSummaryWrapper.innerHTML;
        }
    }
    </script>
    
    
    `;
}
