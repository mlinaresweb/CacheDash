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
            <script src="https://unpkg.com/feather-icons"></script>
            <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js"></script>
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background-color: #f8f9fa;
                    display: flex;
                    margin: 0;
                    padding: 0;
                }
                .content {
                    margin-left: 290px;
                    margin-right: 40px;
                    padding: 20px;
                    width: calc(100% - 330px);
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
