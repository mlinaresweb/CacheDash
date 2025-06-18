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
           
               <!-- Aquí insertamos el modal que faltaba -->
    <div class="modal fade" id="ttlModal" tabindex="-1" role="dialog" aria-labelledby="ttlModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="ttlModalLabel">Update TTL</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="ttlForm">
              <div class="mb-3">
                <label for="newTtl" class="form-label">New TTL (seconds)</label>
                <input type="number" class="form-control" id="newTtl" required>
              </div>
              <input type="hidden" id="modalService">
              <input type="hidden" id="modalKey">
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" onclick="updateTtl()">Save changes</button>
          </div>
        </div>
      </div>
    </div>

    <div id="alertPlaceholder" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;"></div>
    `;
}
