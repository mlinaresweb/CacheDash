import { CacheStats } from '../../../types/cache';

export function generateServiceListComponentHtml(allStats: Map<string, CacheStats>): string {
    let serviceListHtml = '';

    for (const [service, stats] of allStats) {
        const sizeInKB = (stats.size / 1024).toFixed(2); // Convert bytes to KB and format to 2 decimal places
        serviceListHtml += `
            <div class="col-md-4 col-servicelist">
                <div class="card service-card">
                    <div class="card-body">
                        <div class="service-info">
                            <h5><i class="fas fa-database" style="
                            margin-bottom: 12px;
                        "></i> ${service}</h5>
                            <div class="stats">
                                <div class="stat"style="
                                color: #389138;
                                min-width: 84px;
                            "><i class="fas fa-check-circle"></i> Hits: ${stats.hits}</div>
                                <div class="stat" style="
                                color: #f76a6a;
                                min-width: 119px;
                            "><i class="fas fa-times-circle"></i> Misses: ${stats.misses}</div>
                                <div class="stat" style="
                                color: #39b4ff;
                            "><i class="fas fa-key"></i> Keys: ${stats.keys}</div>
                                <div class="stat" style="
                                color: #bd9e26;
                            "><i class="fas fa-database"></i> Size: ${sizeInKB} KB</div>
                            </div>
                        </div>
                        <a href="/cache-key-stats?service=${service}" class="btn btn-primary">Details</a>
                    </div>
                </div>
            </div>
        `;
    }

    return serviceListHtml;
}
