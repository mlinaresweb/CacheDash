import { generatePagination } from '../../utils/paginationHtmlGenerator';
import {KeyStats} from '../../../types/cache';

export function generatePaginationComponentHtml(service: string, searchKey: string | undefined, page: number, limit: number, sortBy: keyof KeyStats, order: 'asc' | 'desc', totalPages: number): string {
    return `
    <nav aria-label="Page navigation example">
        <ul class="pagination">
            ${generatePagination(service, searchKey, page, limit, sortBy, order, totalPages)}
        </ul>
    </nav>
    `;
}
