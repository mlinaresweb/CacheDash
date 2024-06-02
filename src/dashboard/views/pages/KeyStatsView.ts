import { KeyStats } from '../../../types/cache';
import { generateKeysTableHtml } from '../../components/serviceDashboard/KeysTable';
import { generatePaginationComponentHtml } from '../../components/serviceDashboard/Pagination';
import { generateFiltersHtml } from '../../components/serviceDashboard/Filters';

export function generateKeyStatsViewHtml(service: string, keyStats: KeyStats[], totalItems: number, searchKey?: string, page: number = 1, limit: number = 10, sortBy: keyof KeyStats = 'keyName', order: 'asc' | 'desc' = 'asc'): string {
    const totalPages = Math.ceil(totalItems / limit);
    const filtersHtml = generateFiltersHtml(service, searchKey, sortBy, order);
    const keysTableHtml = generateKeysTableHtml(service, keyStats);
    const paginationHtml = generatePaginationComponentHtml(service, searchKey, page, limit, sortBy, order, totalPages);

    return `
    <html>
    <head>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
        <script>
            const socket = new WebSocket('ws://localhost:8081');
    
            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                console.log('Received:', data);
    
                if (data.type === 'UPDATE_DASHBOARD' && data.service === '${service}') {
                    updateDashboard();
                }
            };
    
            function updateDashboard() {
                const service = '${service}';
                const searchKey = document.getElementById('searchKey').value;
                const sortBy = document.getElementById('sortBy').value;
                const order = document.getElementById('order').value;
    
                fetch(\`/cache-key-stats?service=\${service}&searchKey=\${searchKey}&sortBy=\${sortBy}&order=\${order}\`)
                    .then(response => response.text())
                    .then(html => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        const newTable = tempDiv.querySelector('.table-responsive');
                        const newPagination = tempDiv.querySelector('.pagination');
    
                        if (newTable && newPagination) {
                            const oldTable = document.querySelector('.table-responsive');
                            const oldPagination = document.querySelector('.pagination');
    
                            if (oldTable && oldPagination) {
                                oldTable.innerHTML = newTable.innerHTML;
                                oldPagination.innerHTML = newPagination.innerHTML;
                            }
                        }
                    });
            }
    
            function showAlert(message, type) {
                const alertPlaceholder = document.getElementById('alertPlaceholder');
                const wrapper = document.createElement('div');
                wrapper.innerHTML = [
                    \`<div class="alert alert-\${type} alert-dismissible fade show" role="alert">\`,
                    \`<div>\${message}</div>\`,
                    \`<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>\`,
                    '</div>'
                ].join('');
    
                alertPlaceholder.append(wrapper);
    
                setTimeout(() => {
                    wrapper.classList.remove('show');
                    wrapper.classList.add('hide');
                    setTimeout(() => {
                        alertPlaceholder.removeChild(wrapper);
                    }, 500); // Espera a que la animación termine
                }, 3000);
            }
    
            function deleteKey(service, key) {
                fetch('/delete-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service, key })
                }).then(response => response.json())
                  .then(data => {
                      if (data.message === 'Key deleted successfully') {
                          showAlert('The key has been deleted successfully.', 'danger');
                          setTimeout(() => updateDashboard(), 3000);
                      } else {
                          showAlert('Failed to delete key.', 'danger');
                      }
                  });
            }
    
            function refreshKey(service, key) {
                fetch('/refresh-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service, key })
                }).then(response => response.json())
                  .then(data => {
                      if (data.message === 'Key refreshed successfully') {
                          showAlert('The key has been refreshed successfully.', 'primary');
                          setTimeout(() => updateDashboard(), 3000);
                      } else {
                          showAlert('Failed to refresh key.', 'danger');
                      }
                  });
            }
    
            function showTtlModal(service, key, ttl) {
                document.getElementById('modalService').value = service;
                document.getElementById('modalKey').value = key;
                document.getElementById('newTtl').value = ttl;
                $('#ttlModal').modal('show');
            }
            
            function updateTtl() {
                const service = document.getElementById('modalService').value;
                const key = document.getElementById('modalKey').value;
                const newTtl = parseInt(document.getElementById('newTtl').value, 10);
            
                if (isNaN(newTtl)) {
                    showAlert('TTL must be a number.', 'danger');
                    return;
                }
            
                fetch('/update-ttl', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service, key, ttl: newTtl })
                }).then(response => response.json())
                  .then(data => {
                      if (data.message === 'TTL updated successfully') {
                          showAlert('The TTL has been updated successfully.', 'success');
                          setTimeout(() => updateDashboard(), 3000);
                          $('#ttlModal').modal('hide');
                      } else {
                          showAlert('Failed to update TTL.', 'danger');
                      }
                  });
            }
    
            function flushCache(service) {
                fetch('/flush-cache', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service })
                }).then(response => response.json())
                  .then(data => {
                      if (data.message === 'Cache flushed successfully') {
                          showAlert('The cache has been flushed successfully.', 'danger');
                          setTimeout(() => updateDashboard(), 3000);
                      } else {
                          showAlert('Failed to flush cache.', 'danger');
                      }
                  });
            }
    
            function exportToCsv(service) {
                window.location.href = '/export-key-stats?service=' + service;
            }
    
            function triggerSearchAndSort() {
                document.getElementById('searchForm').submit();
            }
    
            document.addEventListener('DOMContentLoaded', () => {
                document.getElementById('searchKey').addEventListener('input', triggerSearchAndSort);
                document.getElementById('sortBy').addEventListener('change', triggerSearchAndSort);
                document.getElementById('order').addEventListener('change', triggerSearchAndSort);
            });
        </script>
    </head>
   
        <div id="alertPlaceholder" class=""></div>
       
            <a href="/cache-key-stats" class="btn btn-secondary mb-4"><i class="fas fa-arrow-left"></i> Back to Services List</a>
            <h1 class="mb-4">Service: ${service}</h1>
            <div class="btn-group mb-4">
                <button class="btn btn-danger" onclick="flushCache('${service}')">Flush Cache</button>
                <button class="btn btn-success" onclick="exportToCsv('${service}')">Export to CSV</button>
                <a href="/cache-key-stats/charts?service=${service}" class="btn btn-info">View Charts</a>
            </div>
            ${filtersHtml}
            ${keysTableHtml}
            ${paginationHtml}
        
    
        <!-- Modal for updating TTL -->
        <div class="modal fade" id="ttlModal" tabindex="-1" role="dialog" aria-labelledby="ttlModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="ttlModalLabel">Update TTL</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="ttlForm">
                            <div class="form-group">
                                <label for="newTtl">New TTL (seconds)</label>
                                <input type="number" class="form-control" id="newTtl" required>
                            </div>
                            <input type="hidden" id="modalService">
                            <input type="hidden" id="modalKey">
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="updateTtl()">Save changes</button>
                    </div>
                </div>
            </div>
        </div>
    </html>
    `;
}
