export function generateRatiosHtml(service: string, totalHits: number, totalMisses: number, totalKeysAdded: number, totalKeysDeleted: number, totalKeys: number, totalEvictions: number): string {
    const hitRatio = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;
    const missRatio = totalHits + totalMisses > 0 ? (totalMisses / (totalHits + totalMisses)) * 100 : 0;
    const cacheRenewalRate = totalKeys > 0 ? ((totalKeysAdded + totalKeysDeleted) / (totalKeys + totalKeysAdded + totalKeysDeleted)) * 100 : 0;
    const evictionRate = totalKeys > 0 ? (totalEvictions / (totalKeys + totalEvictions)) * 100 : 0;

    const colors = {
        hitRatio: 'green',
        missRatio: 'red',
        cacheRenewalRate: 'orange',
        evictionRate: '#2381f5'
    };

    return `
    <div class="ratios-container mb-4">
        <h3 class="mb-4 text-center">Ratios</h3>
        <div class="row text-center d-flex flex-wrap justify-content-center">
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Hit Ratio</h6>
                        <div class="circular-loader" style="--percentage: ${hitRatio.toFixed(2)}; --color: ${colors.hitRatio};">
                            <div class="circle" style="position: relative; width: 100px; height: 100px;">
                                <svg viewBox="0 0 36 36" class="circular-chart" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                                    <path class="circle-bg" style="fill: none; stroke-width: 3.8;"
                                          d="M18 2.0845
                                             a 15.9155 15.9155 0 0 1 0 31.831
                                             a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path class="circle-fg" style="fill: none; stroke: ${colors.hitRatio}; stroke-width: 3.8; stroke-linecap: round; transition: stroke-dasharray 0.3s;"
                                          d="M18 2.0845
                                             a 15.9155 15.9155 0 0 1 0 31.831
                                             a 15.9155 15.9155 0 0 1 0 -31.831"
                                          stroke-dasharray="${hitRatio.toFixed(2)}, 100" />
                                </svg>
                                <span class="percentage" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">${hitRatio.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Miss Ratio</h6>
                        <div class="circular-loader" style="--percentage: ${missRatio.toFixed(2)}; --color: ${colors.missRatio};">
                            <div class="circle" style="position: relative; width: 100px; height: 100px;">
                                <svg viewBox="0 0 36 36" class="circular-chart" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                                    <path class="circle-bg" style="fill: none; stroke-width: 3.8;"
                                          d="M18 2.0845
                                             a 15.9155 15.9155 0 0 1 0 31.831
                                             a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path class="circle-fg" style="fill: none; stroke: ${colors.missRatio}; stroke-width: 3.8; stroke-linecap: round; transition: stroke-dasharray 0.3s;"
                                          d="M18 2.0845
                                             a 15.9155 15.9155 0 0 1 0 31.831
                                             a 15.9155 15.9155 0 0 1 0 -31.831"
                                          stroke-dasharray="${missRatio.toFixed(2)}, 100" />
                                </svg>
                                <span class="percentage" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">${missRatio.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Cache Renewal Rate</h6>
                        <div class="circular-loader" style="--percentage: ${cacheRenewalRate.toFixed(2)}; --color: ${colors.cacheRenewalRate};">
                            <div class="circle" style="position: relative; width: 100px; height: 100px;">
                                <svg viewBox="0 0 36 36" class="circular-chart" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                                    <path class="circle-bg" style="fill: none; stroke-width: 3.8;"
                                          d="M18 2.0845
                                             a 15.9155 15.9155 0 0 1 0 31.831
                                             a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path class="circle-fg" style="fill: none; stroke: ${colors.cacheRenewalRate}; stroke-width: 3.8; stroke-linecap: round; transition: stroke-dasharray 0.3s;"
                                          d="M18 2.0845
                                             a 15.9155 15.9155 0 0 1 0 31.831
                                             a 15.9155 15.9155 0 0 1 0 -31.831"
                                          stroke-dasharray="${cacheRenewalRate.toFixed(2)}, 100" />
                                </svg>
                                <span class="percentage" style=" position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">${cacheRenewalRate.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-6 col-md-6 mb-3 d-flex">
                <div class="card card-statics shadow-sm flex-fill">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-subtitle mb-2 text-statics">Eviction Rate</h6>
                        <div class="circular-loader" style="--percentage: ${evictionRate.toFixed(2)}; --color: ${colors.evictionRate};">
                            <div class="circle" style="position: relative; width: 100px; height: 100px;">
                                <svg viewBox="0 0 36 36" class="circular-chart" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                                    <path class="circle-bg" style="fill: none; stroke-width: 3.8;"
                                          d="M18 2.0845
                                             a 15.9155 15.9155 0 0 1 0 31.831
                                             a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path class="circle-fg" style="fill: none; stroke: ${colors.evictionRate}; stroke-width: 3.8; stroke-linecap: round; transition: stroke-dasharray 0.3s;"
                                          d="M18 2.0845
                                             a 15.9155 15.9155 0 0 1 0 31.831
                                             a 15.9155 15.9155 0 0 1 0 -31.831"
                                          stroke-dasharray="${evictionRate.toFixed(2)}, 100" />
                                </svg>
                                <span class="percentage" style=" position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">${evictionRate.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}
