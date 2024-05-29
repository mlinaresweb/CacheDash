import {KeyStats} from '../../../types/cache';

export function generateFiltersHtml(service: string, searchKey?: string, sortBy: keyof KeyStats = 'keyName', order: 'asc' | 'desc' = 'asc'): string {
    return `
    <form id="searchForm" class="form-inline float-right mb-4" action="/cache-key-stats" method="get">
        <input type="hidden" name="service" value="${service}">
        <input id="searchKey" class="form-control mr-sm-2" type="search" name="searchKey" placeholder="Search by key" aria-label="Search" value="${searchKey || ''}">
        <select id="sortBy" class="form-control mr-sm-2" name="sortBy">
            <option value="keyName" ${sortBy === 'keyName' ? 'selected' : ''}>Key</option>
            <option value="hits" ${sortBy === 'hits' ? 'selected' : ''}>Hits</option>
            <option value="misses" ${sortBy === 'misses' ? 'selected' : ''}>Misses</option>
            <option value="setTime" ${sortBy === 'setTime' ? 'selected' : ''}>Set Time</option>
            <option value="endTime" ${sortBy === 'endTime' ? 'selected' : ''}>End Time</option>
            <option value="ttl" ${sortBy === 'ttl' ? 'selected' : ''}>TTL (seconds)</option>
            <option value="size" ${sortBy === 'size' ? 'selected' : ''}>Size (bytes)</option>
        </select>
        <select id="order" class="form-control mr-sm-2" name="order">
            <option value="asc" ${order === 'asc' ? 'selected' : ''}>Ascending</option>
            <option value="desc" ${order === 'desc' ? 'selected' : ''}>Descending</option>
        </select>
    </form>
    `;
}
