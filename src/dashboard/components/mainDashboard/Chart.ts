export function generateChartHtml(): string {
    return `
        <div>
            <h2 style="color: white;">Cache Calls Over Time for All Services</h2>
            <canvas id="allServicesCacheCallsChart" data-testid="stats-chart"></canvas>
            <script>
                document.addEventListener('DOMContentLoaded', async function () {
                    const response = await fetch('/all-services-call-history');
                    const callHistory = await response.json();

                    const labels = Object.keys(callHistory);
                    const data = Object.values(callHistory);

                    const ctx = document.getElementById('allServicesCacheCallsChart').getContext('2d');
                    const allServicesCacheCallsChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Cache Calls Per Hour',
                                data: data,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                                fill: false,
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                                pointBorderColor: '#fff'
                            }]
                        },
                        options: {
                            scales: {
                                x: {
                                    type: 'time',
                                    time: {
                                        unit: 'hour'
                                    },
                                    title: {
                                        display: true,
                                        text: 'Time',
                                        color: 'white'
                                    },
                                    ticks: {
                                        color: 'white'
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.2)'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Calls',
                                        color: 'white'
                                    },
                                    ticks: {
                                        color: 'white'
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.2)'
                                    }
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    color: 'white'
                                },
                                legend: {
                                    labels: {
                                        color: 'white'
                                    }
                                }
                            }
                        }
                    });

                    // WebSocket para actualizar el gráfico en tiempo real
                    const socket = new WebSocket('ws://localhost:8081');

                    socket.addEventListener('message', function (event) {
                        const data = JSON.parse(event.data);
                        
                        if (data.type === 'UPDATE_GLOBAL_DASHBOARD') {
                            updateChart(data.callHistory);
                        }
                    });

                    function updateChart(callHistory) {
                        const labels = Object.keys(callHistory);
                        const data = Object.values(callHistory);

                        allServicesCacheCallsChart.data.labels = labels;
                        allServicesCacheCallsChart.data.datasets[0].data = data;
                        allServicesCacheCallsChart.update();
                    }
                });
            </script>
        </div>
    `;
}
