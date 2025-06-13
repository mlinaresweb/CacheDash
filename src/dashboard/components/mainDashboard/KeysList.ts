import { KeyStats } from '../../../types/cache';

function getSimplifiedKeyName(keyName: string): string {
    const parts = keyName.split('/');
    return parts[parts.length - 1] || keyName;
}

export function generateKeysListHtml(keyStatsRegistry: Map<string, Map<string, KeyStats>>): string {
    type KeyInfo = {
        key: string;
        simplifiedKey: string;
        service: string;
        hits: number;
        misses: number;
        setTime: number;
        endTime: number;
        ttl: number;
        timeRemaining: number;
        size: number;
    };

    let keys: KeyInfo[] = [];
    keyStatsRegistry.forEach((serviceKeyStats, serviceIdentifier) => {
        serviceKeyStats.forEach((keyStat) => {
            keys.push({
                key: keyStat.keyName,
                simplifiedKey: getSimplifiedKeyName(keyStat.keyName),
                service: serviceIdentifier,
                hits: keyStat.hits || 0,
                misses: keyStat.misses || 0,
                setTime: keyStat.setTime || 0,
                endTime: keyStat.endTime || 0,
                ttl: keyStat.ttl || 0,
                timeRemaining: Math.max(0, Math.floor((keyStat.setTime + keyStat.ttl * 1000 - Date.now()) / 1000)),
                size: keyStat.size
            });
        });
    });

    keys.sort((a, b) => b.size - a.size);

    let rows = '';
    keys.forEach(key => {
        rows += `
            <tr>
                <td class="truncate" title="${key.key}">${key.simplifiedKey}</td>
                <td>${key.service}</td>
                <td>${key.hits}</td>
                <td>${key.misses}</td>
                <td>${new Date(key.setTime).toLocaleString()}</td>
                <td>${new Date(key.endTime).toLocaleString()}</td>
                <td>${key.ttl}</td>
                <td>${key.timeRemaining}</td>
                <td>${key.size}</td>
                <td class="actions">
                    <button class="btn btn-danger btn-sm" data-testid="delete-key" onclick="globalDeleteKey('${key.service}', '${key.key}')"><i class="fas fa-trash-alt"></i></button>
                    <button class="btn btn-primary btn-sm" onclick="globalRefreshKey('${key.service}', '${key.key}')"><i class="fas fa-sync-alt"></i></button>
                    <button class="btn btn-secondary btn-sm" onclick="showTtlModal('${key.service}', '${key.key}', ${key.ttl})"><i class="fas fa-cog"></i></button>
                </td>
            </tr>
        `;
    });

    return `
    <div class="global-actions mt-3">
        <button class="btn btn-danger" onclick="globalFlushCache()">Flush All Caches</button>
        <a href="/dashboard/estadisticas" class="btn btn-info">Statistics</a>
    </div>
    <div class="keys-section">
        <div class="keys-filters mb-3">
            <div class="row flex-nowrap flex-wrap flex-lg-row align-items-end">
                <div class="col-12 col-md-6 d-flex mb-2 mb-md-0" style="gap: 10px;">
                    <select id="sort-by" class="form-select me-2" onchange="sortTable('keys-table')" aria-label="Sort by">
                        <option value="size">Size</option>
                        <option value="key">Key</option>
                        <option value="service">Service</option>
                        <option value="hits">Hits</option>
                        <option value="misses">Misses</option>
                        <option value="setTime">Set Time</option>
                        <option value="endTime">End Time</option>
                        <option value="ttl">TTL</option>
                        <option value="timeRemaining">Time Remaining</option>
                    </select>
                    <select id="sort-direction" class="form-select" onchange="sortTable('keys-table')" aria-label="Sort direction">
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                    </select>
                </div>
                <div class="col-12 col-md-6 mb-2 mb-md-0">
                    <input type="text" id="search-key" class="form-control" oninput="filterTable('keys-table')" placeholder="Search">
                </div>
            </div>
        </div>
        <div class="keys-list-container">
            <table id="keys-table" class="table table-striped mt-4" data-testid="service-table">
                <thead>
                    <tr>
                        <th class="truncate">Key</th>
                        <th>Service</th>
                        <th>Hits</th>
                        <th>Misses</th>
                        <th>Set Time</th>
                        <th>End Time</th>
                        <th>TTL</th>
                        <th>Time Remaining</th>
                        <th>Size</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    </div>
        <script>
            const socket = new WebSocket('ws://localhost:8081');

            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                console.log('Received:', data);

                if (data.type === 'UPDATE_DASHBOARD') {
                    updateDashboard();
                }
            };

            function updateDashboard() {
                fetch('/dashboard')
                    .then(response => response.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');

                        const newKeysSection = doc.querySelector('.keys-section');
                        const newCardsContainer = doc.querySelector('.container');

                        const oldKeysSection = document.querySelector('.keys-section');
                        const oldCardsContainer = document.querySelector('.container');

                        if (newKeysSection && oldKeysSection) {
                            oldKeysSection.innerHTML = newKeysSection.innerHTML;
                        }

                        if (newCardsContainer && oldCardsContainer) {
                            oldCardsContainer.innerHTML = newCardsContainer.innerHTML;
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

            function globalDeleteKey(service, key) {
                fetch('/delete-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ service, key })
                })
                .then(response => response.json())
                .then(data => {
                    showAlert(data.message, 'danger');
                    if (data.message.includes('successfully')) {
                        updateDashboard();
                    }
                })
                .catch(error => console.error('Error:', error));
            }

            function globalRefreshKey(service, key) {
                fetch('/refresh-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ service, key })
                })
                .then(response => response.json())
                .then(data => {
                    showAlert(data.message, 'primary');
                    if (data.message.includes('successfully')) {
                        updateDashboard();
                    }
                })
                .catch(error => console.error('Error:', error));
            }

            function globalFlushCache() {
                fetch('/flush-cache', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ service: 'all' })
                })
                .then(response => response.json())
                .then(data => {
                    showAlert(data.message, 'danger');
                    if (data.message.includes('successfully')) {
                        updateDashboard();
                    }
                })
                .catch(error => console.error('Error:', error));
            }

            function sortTable(tableId) {
                const table = document.getElementById(tableId).getElementsByTagName('tbody')[0];
                const rows = Array.from(table.getElementsByTagName('tr'));
                const sortBy = document.getElementById('sort-by').value;
                const sortDirection = document.getElementById('sort-direction').value;

                const getCellValue = (row, index) => row.children[index].innerText || row.children[index].textContent;

                const comparer = (idx, asc, isNumeric) => (a, b) => {
                    const v1 = getCellValue(asc ? a : b, idx);
                    const v2 = getCellValue(asc ? b : a, idx);
                    if (isNumeric) {
                        return parseFloat(v1) - parseFloat(v2);
                    } else {
                        return v1.localeCompare(v2);
                    }
                };

                let columnIndex, isNumeric = false;
                switch (sortBy) {
                    case 'key':
                        columnIndex = 0;
                        break;
                    case 'service':
                        columnIndex = 1;
                        break;
                    case 'hits':
                        columnIndex = 2;
                        isNumeric = true;
                        break;
                    case 'misses':
                        columnIndex = 3;
                        isNumeric = true;
                        break;
                    case 'setTime':
                        columnIndex = 4;
                        isNumeric = true;
                        break;
                    case 'endTime':
                        columnIndex = 5;
                        isNumeric = true;
                        break;
                    case 'ttl':
                        columnIndex = 6;
                        isNumeric = true;
                        break;
                    case 'timeRemaining':
                        columnIndex = 7;
                        isNumeric = true;
                        break;
                    case 'size':
                        columnIndex = 8;
                        isNumeric = true;
                        break;
                }

                const ascending = sortDirection === 'asc';
                rows.sort(comparer(columnIndex, ascending, isNumeric)).forEach(row => table.appendChild(row));
            }

            function filterTable(tableId) {
                const searchKey = document.getElementById('search-key').value.toLowerCase();
                const table = document.getElementById(tableId).getElementsByTagName('tbody')[0];
                const rows = Array.from(table.getElementsByTagName('tr'));

                rows.forEach(row => {
                    const cells = Array.from(row.getElementsByTagName('td'));
                    const match = cells.some(cell => cell.innerText.toLowerCase().includes(searchKey));
                    row.style.display = match ? '' : 'none';
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
                    headers: {
                        'Content-Type': 'application/json'
                    },
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

            document.addEventListener('DOMContentLoaded', function() {
                sortTable('keys-table'); // Ordenar por tamaño por defecto al cargar la página
            });
        </script>
    `;
}
