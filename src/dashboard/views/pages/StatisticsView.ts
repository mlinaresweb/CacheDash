import { generateSummaryHtml } from '../../components/statistics/Summary';
import { generateRatiosHtml } from '../../components/statistics/Ratios';
import { generateChartsHtml } from '../../components/statistics/Charts';

export function generateStatisticsViewHtml(
    service: string, 
    labelsHitsMisses: string[], 
    hits: number[], 
    misses: number[], 
    labelsSizes: string[],
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
    const chartsHtml = generateChartsHtml(labelsHitsMisses, hits, misses, sizes, averageResponseTime, keyResponseTimes, keyResponseLabels, uncachedKeyResponseTimes, uncachedKeyResponseLabels);

    return `
            <a href="/cache-key-stats?service=${service}" class="btn btn-secondary mb-4"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
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
                    
                    if (data.type === 'UPDATE_SERVICE_STATISTICS' && data.service === '${service}') {
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

            function updateCharts(data) {
                const { labelsHitsMisses, hits, misses, labelsSizes, sizes, keyResponseTimes, keyResponseLabels, uncachedKeyResponseTimes, uncachedKeyResponseLabels } = data;

                if (labelsHitsMisses && labelsSizes && hits && misses && sizes && keyResponseTimes && keyResponseLabels && uncachedKeyResponseTimes && uncachedKeyResponseLabels) {
                    const simplifiedLabelsHitsMisses = labelsHitsMisses.map(label => label.split('/').pop());
                    const simplifiedLabelsSizes = labelsSizes.map(label => label.split('/').pop());
                    const simplifiedKeyResponseLabels = keyResponseLabels.map(label => label.split('/').pop());
                    const simplifiedUncachedKeyResponseLabels = uncachedKeyResponseLabels.map(label => label.split('/').pop());

                    cacheStatsChartHitsMisses.data.labels = simplifiedLabelsHitsMisses;
                    cacheStatsChartHitsMisses.data.datasets[0].data = hits;
                    cacheStatsChartHitsMisses.data.datasets[1].data = misses;
                    cacheStatsChartHitsMisses.update();

                    cacheStatsChartSizes.data.labels = simplifiedLabelsSizes;
                    cacheStatsChartSizes.data.datasets[0].data = sizes;
                    cacheStatsChartSizes.update();

                    responseTimeChart.data.labels = simplifiedKeyResponseLabels;
                    responseTimeChart.data.datasets[0].data = keyResponseTimes;
                    responseTimeChart.update();

                    uncachedResponseTimeChart.data.labels = simplifiedUncachedKeyResponseLabels;
                    uncachedResponseTimeChart.data.datasets[0].data = uncachedKeyResponseTimes;
                    uncachedResponseTimeChart.update();
                } else {
                    console.error("Datos incompletos para actualizar los gráficos");
                }
            }

            </script>
    `;
}
