import { generateSidebarHtml } from '../components/sidebar';

export function generateLayoutHtml(content: string): string {
    const sidebarHtml = generateSidebarHtml();
    return `
        <html>
        <head>
            <title>CacheDash Dashboard</title>
            <link rel="stylesheet" href="/styles/styles.css"> 
            <link rel="stylesheet" href="/styles/sidebar.css"> 
            <link rel="stylesheet" href="/styles/keyStats.css"> 
            <link rel="stylesheet" href="/styles/logs.css"> 
            <link rel="stylesheet" href="/styles/serviceList.css"> 
            <link rel="stylesheet" href="/styles/stadistics.css"> 
            <link rel="stylesheet" href="/styles/mainDashboard.css"> 

            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
            <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js"></script>
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>
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
