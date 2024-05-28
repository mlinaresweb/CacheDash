import { KeyStats } from '../../types/cache';
import { generatePagination } from '../utils/htmlGenerator';
import { generateSidebarHtml } from './sidebar';

export function generateHtmlDashboard(service: string, keyStats: KeyStats[], totalItems: number, searchKey?: string, page: number = 1, limit: number = 10, sortBy: keyof KeyStats = 'keyName', order: 'asc' | 'desc' = 'asc'): string {
    const totalPages = Math.ceil(totalItems / limit);
    const sidebarHtml = generateSidebarHtml();

    let html = `
    <html>
    <head>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
        <style>
            body {
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
            .button { cursor: pointer; }
            .dropdown { margin-right: 5px; }
            .table thead th { border-bottom: 2px solid #dee2e6; }
            .table thead th.sortable:hover { cursor: pointer; background-color: #f1f1f1; }
            .pagination { justify-content: center; margin-top: 20px; }
            .pagination .page-item.active .page-link { background-color: #007bff; border-color: #007bff; }
            .btn-group { display: flex; justify-content: flex-end; }
            .btn-group .btn { margin-right: 5px; }
            @media (max-width: 576px) {
                .btn-group { flex-direction: column; align-items: stretch; }
                .btn-group .btn { margin-bottom: 5px; margin-right: 0; }
                .form-inline { flex-direction: column; align-items: stretch; }
                .form-inline .form-control { margin-bottom: 5px; }
            }
            .table-responsive { 
                overflow-x: auto; 
                -webkit-overflow-scrolling: touch; 
                display: block;
            }
            .truncate {
                max-width: 200px;
                white-space: normal;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
            }
            .actions {
                display: flex;
                gap: 5px;
            }
            .alert {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1050;
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            .alert.hide {
                animation: fadeOut 0.5s forwards;
            }
        </style>
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
    <body>
        ${sidebarHtml}
        <div id="alertPlaceholder" class=""></div>
        <div class="content">
            <a href="/cache-key-stats" class="btn btn-secondary mb-4"><i class="fas fa-arrow-left"></i> Back to Services List</a>
            <h2 class="mb-4">Service: ${service}</h2>
            <div class="btn-group mb-4">
                <button class="btn btn-danger" onclick="flushCache('${service}')">Flush Cache</button>
                <button class="btn btn-success" onclick="exportToCsv('${service}')">Export to CSV</button>
                <a href="/cache-key-stats/charts?service=${service}" class="btn btn-info">View Charts</a>
            </div>
            <form id="searchForm" class="form-inline float-right mb-4" action="/cache-key-stats" method="get">
                <input type="hidden" name="service" value="${service}">
                <input id="searchKey" class="form-control mr-sm-2" type="search" name="searchKey" placeholder="Search by key" aria-label="Search" value="${searchKey || ''}">
                <select id="sortBy" class="form-control mr-sm-2" name="sortBy">
                    <option value="keyName" ${sortBy === 'keyName' ? 'selected' : ''}>Key</option>
                    <option value="hits" ${sortBy === 'hits' ? 'selected' : ''}>Hits</option>
                    <option value="misses" ${sortBy === 'misses' ? 'selected' : ''}>Misses</option>
                    <option value="setTime" ${sortBy === 'setTime' ? 'selected' : ''}>Set Time</option>
                    <option value="endTime" ${sortBy === 'endTime' ? 'selected' : ''}>End Time</option>
                    <option value="ttl" ${sortBy === 'ttl' ? 'selected' : ''}>TTL (seconds)</option>
                    <option value="size" ${sortBy === 'size' ? 'selected' : ''}>Size (bytes)</option>
                </select>
                <select id="order" class="form-control mr-sm-2" name="order">
                    <option value="asc" ${order === 'asc' ? 'selected' : ''}>Ascending</option>
                    <option value="desc" ${order === 'desc' ? 'selected' : ''}>Descending</option>
                </select>
            </form>
            <div class="table-responsive">
                <table class="table table-striped mt-4">
                    <thead>
                        <tr>
                            <th class="truncate">Key</th>
                            <th>Hits</th>
                            <th>Misses</th>
                            <th>Set Time</th>
                            <th>End Time</th>
                            <th>TTL (seconds)</th>
                            <th>Time Remaining (seconds)</th>
                            <th>Size (bytes)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${keyStats.map(stat => {
                            const setTime = new Date(stat.setTime).toLocaleString();
                            const endTime = new Date(stat.endTime || 0).toLocaleString();
                            const timeRemaining = Math.max(0, Math.floor((stat.setTime + stat.ttl * 1000 - Date.now()) / 1000));
    
                            return `
                            <tr>
                                <td class="truncate">${stat.keyName}</td>
                                <td>${stat.hits}</td>
                                <td>${stat.misses}</td>
                                <td>${setTime}</td>
                                <td>${endTime}</td>
                                <td>${stat.ttl}</td>
                                <td>${timeRemaining}</td>
                                <td>${stat.size}</td>
                                <td class="actions">
                                    <button class="btn btn-danger btn-sm" onclick="deleteKey('${service}', '${stat.keyName}')"><i class="fas fa-trash-alt"></i></button>
                                    <button class="btn btn-primary btn-sm" onclick="refreshKey('${service}', '${stat.keyName}')"><i class="fas fa-sync-alt"></i></button>
                                    <button class="btn btn-secondary btn-sm" onclick="showTtlModal('${service}', '${stat.keyName}', ${stat.ttl})"><i class="fas fa-cog"></i></button>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <nav aria-label="Page navigation example">
                <ul class="pagination">
                    ${generatePagination(service, searchKey, page, limit, sortBy, order, totalPages)}
                </ul>
            </nav>
        </div>
    
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
    </body>
    </html>
    `;

    return html;
}