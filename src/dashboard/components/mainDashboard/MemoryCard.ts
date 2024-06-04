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
            <div class="card card-maindashboard" data-service="${serviceIdentifier}">
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
                    <span>Used Memory: ${usedMemoryMB.toFixed(2)} MB</span> <!-- Aseguramos la precisión -->
                    <span>Max Memory: ${maxMemoryText}</span>
                </div>
            </div>
        `;
    });

    return `
        <div class="cards-container cards-container-maindashboard">${cards}</div>
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const socket = new WebSocket('ws://localhost:8081');
                
                socket.addEventListener('message', function (event) {
                    const data = JSON.parse(event.data);
                    console.log("Datos recibidos del WebSocket:", data);
                    
                    if (data.type === 'UPDATE_GLOBAL_DASHBOARD') {
                        updateMemoryCards(data.memoryStats);
                    }
                });

                function updateMemoryCards(memoryStats) {
                    console.log("Actualizando memoryStats:", memoryStats);
                    memoryStats.forEach(([serviceIdentifier, serviceStats]) => {
                        const card = document.querySelector(\`[data-service="\${serviceIdentifier}"]\`);
                        if (card) {
                            const maxMemorySizeMB = serviceStats.maxMemorySizeMB;
                            const usedMemoryMB = serviceStats.size / (1024 * 1024);
                            let usagePercentage = 0;
                            if (maxMemorySizeMB) {
                                usagePercentage = (usedMemoryMB / maxMemorySizeMB) * 100;
                            }
                            let color = '#4caf50';

                            if (usagePercentage > 85) {
                                color = '#f44336';
                            } else if (usagePercentage > 60) {
                                color = '#ff9800';
                            }

                            const maxMemoryText = maxMemorySizeMB !== undefined ? \`\${maxMemorySizeMB} MB\` : 'NO LIMIT';

                            card.querySelector('.circular-loader').style.setProperty('--percentage', usagePercentage.toString());
                            card.querySelector('.circular-loader').style.setProperty('--color', color);
                            card.querySelector('.circle-fg').setAttribute('stroke-dasharray', \`\${usagePercentage}, 100\`);
                            card.querySelector('.percentage').textContent = \`\${usagePercentage.toFixed(2)}%\`;
                            card.querySelector('.memory-info span:nth-child(1)').textContent = \`Used Memory: \${usedMemoryMB.toFixed(2)} MB\`;
                            card.querySelector('.memory-info span:nth-child(2)').textContent = \`Max Memory: \${maxMemoryText}\`;
                        }
                    });
                }
            });
        </script>
    `;
}
