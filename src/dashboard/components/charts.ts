import { generateSidebarHtml } from './sidebar';

export function generateSummaryHtml(service: string, totalHits: number, totalMisses: number, totalKeys: number, totalSize: number, averageResponseTime: number, uncachedAverageResponseTime: number): string {
    return `
    <div class="summary-container mb-4">
        <h3 class="mb-4 text-center">Service: ${service} - Summary</h3>
        <div class="row text-center d-flex flex-wrap justify-content-center">
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Total Hits</h6>
                        <h5 class="card-title display-4 text-success">${totalHits}</h5>
                        <i class="fas fa-check-circle text-success fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Total Misses</h6>
                        <h5 class="card-title display-4 text-danger">${totalMisses}</h5>
                        <i class="fas fa-times-circle text-danger fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Total Keys</h6>
                        <h5 class="card-title display-4 text-info">${totalKeys}</h5>
                        <i class="fas fa-key text-info fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Total Size</h6>
                        <h5 class="card-title display-4 text-warning">${(totalSize / 1024).toFixed(2)} KB</h5>
                        <i class="fas fa-database text-warning fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Avg. Response Time (Cached)</h6>
                        <h5 class="card-title display-4 text-primary">${averageResponseTime.toFixed(2)} ms</h5>
                        <i class="fas fa-stopwatch text-primary fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Avg. Response Time (Uncached)</h6>
                        <h5 class="card-title display-4 text-secondary">${uncachedAverageResponseTime.toFixed(2)} ms</h5>
                        <i class="fas fa-stopwatch text-secondary fa-2x"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function generateRatiosHtml(service: string, totalHits: number, totalMisses: number, totalKeysAdded: number, totalKeysDeleted: number, totalKeys: number, totalEvictions: number): string {
    const hitRatio = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;
    const missRatio = totalHits + totalMisses > 0 ? (totalMisses / (totalHits + totalMisses)) * 100 : 0;
    const cacheRenewalRate = totalKeys > 0 ? ((totalKeysAdded + totalKeysDeleted) / (totalKeys + totalKeysAdded + totalKeysDeleted)) * 100 : 0;
    const evictionRate = totalKeys > 0 ? (totalEvictions / (totalKeys + totalEvictions)) * 100 : 0;

    return `
    <div class="ratios-container mb-4">
        <h3 class="mb-4 text-center"> Ratios</h3>
        <div class="row text-center d-flex flex-wrap justify-content-center">
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Hit Ratio</h6>
                        <h5 class="card-title display-4 text-success">${hitRatio.toFixed(2)}%</h5>
                        <i class="fas fa-thumbs-up text-success fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Miss Ratio</h6>
                        <h5 class="card-title display-4 text-danger">${missRatio.toFixed(2)}%</h5>
                        <i class="fas fa-thumbs-down text-danger fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Cache Renewal Rate</h6>
                        <h5 class="card-title display-4 text-warning">${cacheRenewalRate.toFixed(2)}%</h5>
                        <i class="fas fa-sync text-warning fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Eviction Rate</h6>
                        <h5 class="card-title display-4 text-primary">${evictionRate.toFixed(2)}%</h5>
                        <i class="fas fa-exclamation-triangle text-primary fa-2x"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function generateChartsHtml(service: string, labels: string[], hits: number[], misses: number[], sizes: number[], totalHits: number, totalMisses: number, totalKeys: number, totalSize: number, averageResponseTime: number, uncachedAverageResponseTime: number, keyResponseTimes: number[], keyResponseLabels: string[], uncachedKeyResponseTimes: number[], uncachedKeyResponseLabels: string[], totalKeysAdded: number, totalKeysDeleted: number, totalEvictions: number): string {
    const summaryHtml = generateSummaryHtml(service, totalHits, totalMisses, totalKeys, totalSize, averageResponseTime, uncachedAverageResponseTime);
    const ratiosHtml = generateRatiosHtml(service, totalHits, totalMisses, totalKeysAdded, totalKeysDeleted, totalKeys, totalEvictions);

    const sidebarHtml = generateSidebarHtml();
    let html = `
    <html>
    <head>
        <!-- Carga de hojas de estilo -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    
        <!-- Carga de Chart.js -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
        .chart-container { 
            padding: 15px; 
            border-radius: 8px; 
            background-color: #fff;
            box-shadow: 0 6px 10px rgba(0,0,0,0.1); 
            margin-bottom: 30px; 
            width: 48%; /* Nearly half the width of the container to fit two in one row */
            min-height: 400px; /* Setting a minimum height for better visibility */
        }
        canvas { 
            width: 100%; /* Ensures the canvas takes full width of its container */
            height: 100%; /* Makes the canvas take full height of its container */
        }
        .title { 
            text-align: center; 
            margin-top: 20px; 
            margin-bottom: 30px; 
            font-size: 22px; 
            color: #333;
        }
        .btn-secondary { 
            background-color: #6c757d; 
        }
        .wrapper-chart { 
            display: flex; 
            flex-wrap: wrap; 
            justify-content: space-between; /* Adjusts spacing between charts */
        }
        @media (max-width: 768px) {
            .wrapper-chart { 
                flex-direction: column; 
                align-items: center; 
            }
            .chart-container {
                width: 100%; /* Full width on small screens */
            }
        }
        .summary-wrapper {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 20px;
        }
        .summary-container {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            background-color: #fff;
            box-shadow: 0 6px 10px rgba(0,0,0,0.1);
            width: 66%;
        }
        .ratios-container {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            background-color: #fff;
            box-shadow: 0 6px 10px rgba(0,0,0,0.1);
            width: 30%;
        }
        @media (max-width: 1200px) {
            .summary-container, .ratios-container {
                width: 100%;
            }
        }
        .response-time-container {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            background-color: #fff;
            box-shadow: 0 6px 10px rgba(0,0,0,0.1);
        }
        .card {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .card-body {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        .card-subtitle {
            min-height: 3rem; /* Adjust this value to set the minimum height for the subtitles */
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card-title {
            margin-bottom: .75rem;
            font-size: 2.5rem !important;
        }
        .fa-2x {
            font-size: 1.8em !important;
        }
        
        </style>
        <script>
        function renderChart(labels, hits, misses, sizes, averageResponseTime, keyResponseTimes, keyResponseLabels, uncachedKeyResponseTimes, uncachedKeyResponseLabels) {
            const ctxHitsMisses = document.getElementById('cacheStatsChartHitsMisses').getContext('2d');
            const ctxSizes = document.getElementById('cacheStatsChartSizes').getContext('2d');
            const ctxResponseTime = document.getElementById('responseTimeChart').getContext('2d');
            const ctxUncachedResponseTime = document.getElementById('uncachedResponseTimeChart').getContext('2d');
        
            // Simplifica las etiquetas para que solo muestren el último segmento por defecto
            const simplifiedLabels = labels.map(label => label.split('/').pop());
            const simplifiedKeyResponseLabels = keyResponseLabels.map(label => label.split('/').pop());
            const simplifiedUncachedKeyResponseLabels = uncachedKeyResponseLabels.map(label => label.split('/').pop());
        
            // Configuración de gráficos
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
                            // Mostrar URL completa al hacer hover
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
                            // Mostrar URL completa al hacer hover
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
                            // Mostrar URL completa al hacer hover
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
                            // Mostrar URL completa al hacer hover
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
    </head>
    <body>
        ${sidebarHtml} 
        <div class="content">
            <a href="/cache-key-stats?service=${service}" class="btn btn-secondary mb-4"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
            <div class="summary-wrapper">
                ${summaryHtml}
                ${ratiosHtml}
            </div>
            <h2 class="title">Service: ${service} - Statistics</h2>
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
        </div>
    </body>
    </html>
    `;
    return html;
}
