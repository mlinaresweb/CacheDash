export function generateRatiosHtml(service: string, totalHits: number, totalMisses: number, totalKeysAdded: number, totalKeysDeleted: number, totalKeys: number, totalEvictions: number): string {
    const hitRatio = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;
    const missRatio = totalHits + totalMisses > 0 ? (totalMisses / (totalHits + totalMisses)) * 100 : 0;
    const cacheRenewalRate = totalKeys > 0 ? ((totalKeysAdded + totalKeysDeleted) / (totalKeys + totalKeysAdded + totalKeysDeleted)) * 100 : 0;
    const evictionRate = totalKeys > 0 ? (totalEvictions / (totalKeys + totalEvictions)) * 100 : 0;

    return `
    <div class="ratios-container mb-4">
        <h3 class="mb-4 text-center"> Ratios</h3>
        <div class="row text-center d-flex flex-wrap justify-content-center">
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Hit Ratio</h6>
                        <h5 class="card-title display-4 text-success">${hitRatio.toFixed(2)}%</h5>
                        <i class="fas fa-thumbs-up text-success fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Miss Ratio</h6>
                        <h5 class="card-title display-4 text-danger">${missRatio.toFixed(2)}%</h5>
                        <i class="fas fa-thumbs-down text-danger fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Cache Renewal Rate</h6>
                        <h5 class="card-title display-4 text-warning">${cacheRenewalRate.toFixed(2)}%</h5>
                        <i class="fas fa-sync text-warning fa-2x"></i>
                    </div>
                </div>
            </div>
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">Eviction Rate</h6>
                        <h5 class="card-title display-4 text-primary">${evictionRate.toFixed(2)}%</h5>
                        <i class="fas fa-exclamation-triangle text-primary fa-2x"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}
