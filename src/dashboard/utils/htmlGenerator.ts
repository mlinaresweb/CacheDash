import { KeyStats } from '../../types/cache';

export function generatePagination(service: string, searchKey: string | undefined, page: number, limit: number, sortBy: keyof KeyStats, order: 'asc' | 'desc', totalPages: number): string {
    const queryParams = `service=${service}&searchKey=${searchKey || ''}&sortBy=${sortBy}&order=${order}`;
    let html = '';

    for (let i = 1; i <= totalPages; i++) {
        html += `
        <li class="page-item ${i === page ? 'active' : ''}">
            <a class="page-link" href="?${queryParams}&page=${i}&limit=${limit}">${i}</a>
        </li>`;
    }

    return html;
}
