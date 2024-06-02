export function generateChartHtml(): string {
    return `
        <div>
            <h2 style="color: white;">Cache Calls Over Time for All Services</h2>
            <canvas id="allServicesCacheCallsChart"></canvas>
            <script>
                document.addEventListener('DOMContentLoaded', async function () {
                    const response = await fetch('/all-services-call-history');
                    const callHistory = await response.json();

                    const labels = Object.keys(callHistory);
                    const data = Object.values(callHistory);

                    const ctx = document.getElementById('allServicesCacheCallsChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Cache Calls Per Hour',
                                data: data,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                                fill: false,
                                backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fondo del área debajo de la línea
                                pointBackgroundColor: 'rgba(75, 192, 192, 1)', // Color de los puntos
                                pointBorderColor: '#fff' // Borde de los puntos
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
                });
            </script>
        </div>
    `;
}
