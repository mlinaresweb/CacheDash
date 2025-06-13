import { KeyStats } from '../../../types/cache';

export function generateKeysTableHtml(service: string, keyStats: KeyStats[]): string {
    return `
    <div class="table-responsive">
        <table id="keys-table" class="table table-striped mt-4" data-testid="service-table">
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
                            <button class="btn btn-danger btn-sm" data-testid="delete-key" onclick="deleteKey('${service}', '${stat.keyName}')"><i class="fas fa-trash-alt"></i></button>
                            <button class="btn btn-primary btn-sm" onclick="refreshKey('${service}', '${stat.keyName}')"><i class="fas fa-sync-alt"></i></button>
                            <button class="btn btn-secondary btn-sm" onclick="showTtlModal('${service}', '${stat.keyName}', ${stat.ttl})"><i class="fas fa-cog"></i></button>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>
    `;
}
