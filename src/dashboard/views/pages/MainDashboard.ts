import { generateMemoryCardHtml } from '../../components/mainDashboard/MemoryCard';
import { generateKeysListHtml } from '../../components/mainDashboard/KeysList';
import { generateChartHtml } from '../../components/mainDashboard/Chart';
import { CacheStats, KeyStats } from '../../../types/cache';

export function generateMainDashboardHtml(statsRegistry: Map<string, CacheStats>, keyStatsRegistry: Map<string, Map<string, KeyStats>>): string {
    const memoryCardHtml = generateMemoryCardHtml(statsRegistry);
    const keysListHtml = generateKeysListHtml(keyStatsRegistry);
    const chartHtml = generateChartHtml();

    return `
        <html>
        <head>
            <title>Main Dashboard</title>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
            <style>
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
                    width: 62%;
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
        
            
                <a href="/dashboard/estadisticas" class="btn btn-secondary mb-4"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
                <h1>Main Dashboard</h1>
                <div class="container-wrapper">
                    ${memoryCardHtml}
                    <div class="chart-container">
                        ${chartHtml}
                    </div>
                </div>
                <div class="tables-container">
                    ${keysListHtml}
                </div>
           
            <div id="alertPlaceholder" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;"></div>
     
        </html>
    `;
}
