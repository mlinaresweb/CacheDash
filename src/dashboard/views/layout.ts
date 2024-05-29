import { generateSidebarHtml } from '../components/sidebar';

export function generateLayoutHtml(content: string): string {
    const sidebarHtml = generateSidebarHtml();
    return `
        <html>
        <head>
            <title>Dashboard</title>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background-color: #f8f9fa;
                    display: flex;
                    margin: 0;
                    padding: 0;
                }
                .content {
                    margin-left: 250px; 
                    padding: 20px;
                    width: calc(100% - 250px); 
                }
                @media (max-width: 992px) {
                    .content {
                        margin-left: 0; 
                        padding: 20px;
                        width: 100%; 
                    }
                }
            </style>
        </head>
        <body>
            ${sidebarHtml}
            <div id="content" class="content">
                ${content}
            </div>
        </body>
        </html>
    `;
}
