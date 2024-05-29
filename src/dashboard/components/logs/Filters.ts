export function generateFiltersHtml(services: string[], isGlobal: boolean, currentService?: string): string {
    const serviceFilter = isGlobal ? `
        <div class="form-group mr-2">
            <select class="form-control" id="serviceFilter" name="service" onchange="applyFilters()">
                <option value="">All Services</option>
                ${services.map(service => `<option value="${service}">${service}</option>`).join('')}
            </select>
        </div>
    ` : '';

    const backButton = currentService ? `
        <a href="/cache-key-stats?service=${currentService}" class="btn btn-secondary mb-4">
            <i class="fas fa-arrow-left"></i> Back to Dashboard
        </a>
    ` : '';

    return `
        ${backButton}
        <form class="form-inline mb-3" id="filterForm">
            ${serviceFilter}
            <div class="form-group mr-2">
                <input type="datetime-local" class="form-control" id="startTimestamp" name="startTimestamp" onchange="applyFilters()" placeholder="Start Timestamp">
            </div>
            <div class="form-group mr-2">
                <select class="form-control" id="messageType" name="messageType" onchange="applyFilters()">
                    <option value="">All Types</option>
                    <option value="set">Set</option>
                    <option value="hit">Hit</option>
                    <option value="miss">Miss</option>
                    <option value="delete">Delete</option>
                    <option value="flush">Flush</option>
                    <option value="expire">Expire</option>
                    <option value="error">Error</option>
                </select>
            </div>
            <div class="form-group mr-2">
                <input type="text" class="form-control" id="search" name="search" placeholder="Search logs" oninput="applyFilters()">
            </div>
            <button type="button" class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
        </form>
    `;
}
