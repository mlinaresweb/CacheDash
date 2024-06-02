import { generateMemoryCardHtml } from '../../components/mainDashboard/MemoryCard';
import { generateKeysListHtml } from '../../components/mainDashboard/KeysList';
import { generateChartHtml } from '../../components/mainDashboard/Chart';
import { CacheStats, KeyStats } from '../../../types/cache';

export function generateMainDashboardHtml(statsRegistry: Map<string, CacheStats>, keyStatsRegistry: Map<string, Map<string, KeyStats>>): string {
    const memoryCardHtml = generateMemoryCardHtml(statsRegistry);
    const keysListHtml = generateKeysListHtml(keyStatsRegistry);
    const chartHtml = generateChartHtml();

    return `       
                <h1>Main <span class="yellow-cache">Dashboard</span></h1>
                <div class="container-wrapper-maindashboard">
                    ${memoryCardHtml}
                    <div class="chart-container-maindashboard">
                        ${chartHtml}
                    </div>
                </div>
                <div class="tables-container">
                
                    ${keysListHtml}
                </div>
           
            <div id="alertPlaceholder" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;"></div>
    `;
}
