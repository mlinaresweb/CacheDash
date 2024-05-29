export function generateChartsHtml(labels: string[], hits: number[], misses: number[], sizes: number[], averageResponseTime: number, keyResponseTimes: number[], keyResponseLabels: string[], uncachedKeyResponseTimes: number[], uncachedKeyResponseLabels: string[]): string {
    return `
        <div class="wrapper-chart">
            <div class="chart-container">
                <canvas id="cacheStatsChartHitsMisses"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="cacheStatsChartSizes"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="responseTimeChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="uncachedResponseTimeChart"></canvas>
            </div>
        </div>
        <script>
        function renderChart(labels, hits, misses, sizes, averageResponseTime, keyResponseTimes, keyResponseLabels, uncachedKeyResponseTimes, uncachedKeyResponseLabels) {
            const ctxHitsMisses = document.getElementById('cacheStatsChartHitsMisses').getContext('2d');
            const ctxSizes = document.getElementById('cacheStatsChartSizes').getContext('2d');
            const ctxResponseTime = document.getElementById('responseTimeChart').getContext('2d');
            const ctxUncachedResponseTime = document.getElementById('uncachedResponseTimeChart').getContext('2d');

            const simplifiedLabels = labels.map(label => label.split('/').pop());
            const simplifiedKeyResponseLabels = keyResponseLabels.map(label => label.split('/').pop());
            const simplifiedUncachedKeyResponseLabels = uncachedKeyResponseLabels.map(label => label.split('/').pop());

            new Chart(ctxHitsMisses, {
                type: 'bar',
                data: {
                    labels: simplifiedLabels,
                    datasets: [
                        {
                            label: 'Hits',
                            data: hits,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 2
                        },
                        {
                            label: 'Misses',
                            data: misses,
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    tooltips: {
                        callbacks: {
                            title: function(tooltipItems, data) {
                                return labels[tooltipItems[0].index];
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(200, 200, 200, 0.2)'
                            }
                        }
                    }
                }
            });

            new Chart(ctxSizes, {
                type: 'bar',
                data: {
                    labels: simplifiedLabels,
                    datasets: [{
                        label: 'Size (KB)',
                        data: sizes,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    tooltips: {
                        callbacks: {
                            title: function(tooltipItems, data) {
                                return labels[tooltipItems[0].index];
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(200, 200, 200, 0.2)'
                            }
                        }
                    }
                }
            });

            new Chart(ctxResponseTime, {
                type: 'bar',
                data: {
                    labels: simplifiedKeyResponseLabels,
                    datasets: [{
                        label: 'Average Response Time (ms)',
                        data: keyResponseTimes,
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(200, 200, 200, 0.2)'
                            }
                        }
                    },
                    tooltips: {
                        callbacks: {
                            title: function(tooltipItems, data) {
                                return keyResponseLabels[tooltipItems[0].index];
                            }
                        }
                    }
                }
            });

            new Chart(ctxUncachedResponseTime, {
                type: 'bar',
                data: {
                    labels: simplifiedUncachedKeyResponseLabels,
                    datasets: [{
                        label: 'Uncached Average Response Time (ms)',
                        data: uncachedKeyResponseTimes,
                        backgroundColor: 'rgba(255, 159, 64, 0.6)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(200, 200, 200, 0.2)'
                            }
                        }
                    },
                    tooltips: {
                        callbacks: {
                            title: function(tooltipItems, data) {
                                return uncachedKeyResponseLabels[tooltipItems[0].index];
                            }
                        }
                    }
                }
            });
        }
            
        document.addEventListener('DOMContentLoaded', function() {
            renderChart(${JSON.stringify(labels)}, ${JSON.stringify(hits)}, ${JSON.stringify(misses)}, ${JSON.stringify(sizes)}, ${averageResponseTime}, ${JSON.stringify(keyResponseTimes)}, ${JSON.stringify(keyResponseLabels)}, ${JSON.stringify(uncachedKeyResponseTimes)}, ${JSON.stringify(uncachedKeyResponseLabels)});
        });
        </script>
    `;
}
