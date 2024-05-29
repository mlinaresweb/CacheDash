export function generateMemoryCardHtml(stats: Map<string, any>): string {
    const services = Array.from(stats.entries());
    let cards = '';

    services.forEach(([serviceIdentifier, serviceStats]) => {
        const maxMemorySizeMB = serviceStats.maxMemorySizeMB;
        const usedMemoryMB = serviceStats.size / (1024 * 1024); // Convertir de bytes a MB
        let usagePercentage = 0;
        if (maxMemorySizeMB) {
            usagePercentage = (usedMemoryMB / maxMemorySizeMB) * 100;
        }
        let color = '#4caf50'; // Verde por defecto

        if (usagePercentage > 85) {
            color = '#f44336'; // Rojo
        } else if (usagePercentage > 60) {
            color = '#ff9800'; // Naranja
        }

        const maxMemoryText = maxMemorySizeMB !== undefined ? `${maxMemorySizeMB} MB` : 'NO LIMIT';

        cards += `
            <div class="card">
                <h2>${serviceIdentifier}</h2>
                <div class="circular-loader" style="--percentage: ${usagePercentage}; --color: ${color};">
                    <div class="circle">
                        <svg viewBox="0 0 36 36" class="circular-chart">
                            <path class="circle-bg"
                                  d="M18 2.0845
                                     a 15.9155 15.9155 0 0 1 0 31.831
                                     a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path class="circle-fg"
                                  d="M18 2.0845
                                     a 15.9155 15.9155 0 0 1 0 31.831
                                     a 15.9155 15.9155 0 0 1 0 -31.831"
                                  stroke-dasharray="${usagePercentage}, 100" />
                        </svg>
                        <span class="percentage">${usagePercentage.toFixed(2)}%</span>
                    </div>
                </div>
                <div class="memory-info">
                    <span>Used Memory: ${usedMemoryMB.toFixed(2)} MB</span>
                    <span>Max Memory: ${maxMemoryText}</span>
                </div>
            </div>
        `;
    });

    return `<div class="cards-container">${cards}</div>`;
}
