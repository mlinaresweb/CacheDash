import { generateSidebarHtml } from './sidebar';

export function generateSettingsPageHtml(serviceSettings: { service: string, defaultTTL: number, maxMemorySize: number }[]): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <title>Cache Settings</title>
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
                .section {
                    margin-bottom: 20px;
                    padding: 10px;
                    border: 1px solid #ccc;
                }
                .section h2 {
                    margin-top: 0;
                }
            </style>
        </head>
        <body>
        <div class="content">
            <h1>Cache Settings</h1>

            <div class="section">
                <h2>Global Configuration</h2>
                <form action="/update-global-settings" method="POST">
                    <label for="globalDefaultTTL">Default TTL (seconds):</label>
                    <input type="number" id="globalDefaultTTL" name="defaultTTL" required><br><br>

                    <label for="globalMaxMemorySizeMB">Max Memory Size (MB):</label>
                    <input type="number" id="globalMaxMemorySizeMB" name="maxMemorySizeMB" required><br><br>

                    <button type="submit" class="btn btn-primary">Update Global Settings</button>
                </form>
            </div>

            ${serviceSettings.map(setting => `
                <div class="section">
                    <h2>Settings for ${setting.service}</h2>
                    <form action="/update-service-settings" method="POST">
                        <input type="hidden" name="serviceIdentifier" value="${setting.service}">
                        
                        <label for="defaultTTL-${setting.service}">Default TTL (seconds):</label>
                        <input type="number" id="defaultTTL-${setting.service}" name="defaultTTL" value="${setting.defaultTTL}" required><br><br>

                        <label for="maxMemorySizeMB-${setting.service}">Max Memory Size (MB):</label>
                        <input type="number" id="maxMemorySizeMB-${setting.service}" name="maxMemorySizeMB" value="${setting.maxMemorySize / (1024 * 1024)}" required><br><br>

                        <button type="submit" class="btn btn-primary">Update Settings</button>
                    </form>
                </div>
            `).join('')}
        </div>
        </body>
        </html>
    `;
}