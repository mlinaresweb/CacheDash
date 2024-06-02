export function generateSummaryHtml(service: string, totalHits: number, totalMisses: number, totalKeys: number, totalSize: number, averageResponseTime: number, uncachedAverageResponseTime: number): string {
    return `
    <div class="summary-container mb-4">
        <h3 class="mb-4 text-center">${service} - Summary</h3>
        <div class="row text-center d-flex flex-wrap justify-content-center">
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex col-sumary" >
                <div class="card  card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Total Hits</h6>
                        <h5 class="card-title display-4 text-success">${totalHits}</h5>
                        <i class="fas fa-check-circle text-success fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex col-sumary">
                <div class="card card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Total Misses</h6>
                        <h5 class="card-title display-4 text-danger">${totalMisses}</h5>
                        <i class="fas fa-times-circle text-danger fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex col-sumary">
                <div class="card card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Total Keys</h6>
                        <h5 class="card-title display-4 text-info">${totalKeys}</h5>
                        <i class="fas fa-key text-info fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex col-sumary">
                <div class="card card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Total Size</h6>
                        <h5 class="card-title display-4 text-warning">${(totalSize / 1024).toFixed(2)} KB</h5>
                        <i class="fas fa-database text-warning fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex col-sumary">
                <div class="card card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Avg. Response Time (Cached)</h6>
                        <h5 class="card-title display-4 text-primary" style="
                        color: #007bff !important;
                    ">${averageResponseTime.toFixed(2)} ms</h5>
                        <i class="fas fa-stopwatch text-primary fa-2x" style="
                        color: #007bff !important;
                    "></i>
                    </div>
                </div>
            </div>
            <div class="col-xxl-2 col-xl-4 col-md-6 mb-3 d-flex col-sumary">
                <div class="card card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Avg. Response Time (Uncached)</h6>
                        <h5 class="card-title display-4 text-secondary" style="
                        color: #bb7aff !important;
                    ">${uncachedAverageResponseTime.toFixed(2)} ms</h5>
                        <i class="fas fa-stopwatch text-secondary fa-2x" style="
                        color: #bb7aff !important;
                    "></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}
