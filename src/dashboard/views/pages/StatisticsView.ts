import { generateSummaryHtml } from '../../components/statistics/Summary';
import { generateRatiosHtml } from '../../components/statistics/Ratios';
import { generateChartsHtml } from '../../components/statistics/Charts';

export function generateStatisticsViewHtml(
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
    <html>
    <head>
        <title>Service Statistics</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
        .chart-container { 
            padding: 15px; 
            border-radius: 8px; 
            background-color: #fff;
            box-shadow: 0 6px 10px rgba(0,0,0,0.1); 
            margin-bottom: 30px; 
            width: 48%; 
            min-height: 400px; 
        }
        canvas { 
            width: 100%; 
            height: 100%; 
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
            justify-content: space-between; 
        }
        @media (max-width: 768px) {
            .wrapper-chart { 
                flex-direction: column; 
                align-items: center; 
            }
            .chart-container {
                width: 100%; 
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
            min-height: 3rem;
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
    </head>  
            <a href="/cache-key-stats?service=${service}" class="btn btn-secondary mb-4"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
            <div class="summary-wrapper">
                ${summaryHtml}
                ${ratiosHtml}
            </div>
            <h2 class="title">Service: ${service} - Statistics</h2>
            ${chartsHtml}
        
    </html>
    `;
}
