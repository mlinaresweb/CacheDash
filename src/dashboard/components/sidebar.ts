import { GlobalCacheStatsCollector } from '../globalCacheStatsCollector';

export function generateSidebarHtml(): string {
    const serviceLinksHtml = generateServiceLinks();
    const activeServicesCount = serviceLinksHtml.split('</a>').length - 1; // Cuenta los enlaces generados

    return `
    <style>
        #serviceListSubmenu {
            display: none;
            flex-direction: column;
            align-items: flex-start;
            transition: max-height 0.35s ease;
            overflow: hidden;
            width: 100%;
        }
        #serviceListSubmenu.show {
            display: flex;
        }
        .sidebar {
            width: 250px;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            background-color: #ffffff;
            padding-top: 60px;
            box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
        }
        .sidebar a {
            padding: 10px 17px;
            text-align: center;
            text-decoration: none;
            font-size: 18px;
            color: black;
            display: flex;
            align-items: center;
            width: 100%;
        }
        .sidebar a:hover {
            background-color: #efefef;
        }
        .sidebar .nav-link.active {
            background-color: #007bff;
            color: white;
        }
        .icono-sidebar {
            margin-right: 16px;
        }
        .services-sidebar {
            padding-left: 32px !important;
            font-size: 14px !important;
        }
        #serviceListSubmenu {
            max-height: 200px; /* Limitar la altura máxima del submenu */
            overflow-y: auto; /* Habilitar el desplazamiento vertical */
        }
        .mobile-menu{
            display:none;
        }
        /* Estilos para el menú móvil */
        @media (max-width: 992px) {
            .sidebar {
                display: none;
            }
            .mobile-menu {
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 10px 0;
                background-color: #ffffff;
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                width: 100%;
                position: fixed;
                bottom: 0;
                left: 0;
                z-index: 1000;
            }
            .mobile-menu a {
                text-align: center;
                font-size: 14px;
                color: black;
                text-decoration: none;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .mobile-menu a:hover {
                background-color: #efefef;
            }
            .mobile-menu .nav-link.active {
                background-color: #007bff;
                color: white;
            }
            .mobile-menu i {
                margin-bottom: 4px;
            }
            .content {
                margin-left: 0; /* Reset left margin for mobile view */
                padding: 20px;
                width: 100%; /* Full width for mobile view */
            }
        }
    </style>
    <div class="sidebar">
        <a href="/dashboard" class="nav-link" ><svg class="icono-sidebar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-activity"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Dashboard</a>
        <a href="/cache-key-stats" class="nav-link" ><svg class="icono-sidebar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-list icono-sidebar"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> Service Lists <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" id="toggleSubmenu" aria-expanded="false" style="margin-left: 51px;"><polyline points="6 9 12 15 18 9"></polyline></svg></a>
        <div id="serviceListSubmenu">
            ${serviceLinksHtml}
        </div>
        <a href="/logs" class="nav-link" ><svg class="icono-sidebar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text icono-sidebar"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Logs</a>
        <a href="/settings" class="nav-link" ><svg class="icono-sidebar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings icono-sidebar"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Settings</a>
    </div>
    <div class="mobile-menu">
        <a href="/dashboard" class="nav-link"><i data-feather="activity"></i> Dashboard</a>
        <a href="/cache-key-stats" class="nav-link"><i data-feather="list"></i> Service Lists</a>
        <a href="/logs" class="nav-link"><i data-feather="file-text"></i> Logs</a>
        <a href="/settings" class="nav-link"><i data-feather="settings"></i> Settings</a>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            feather.replace(); // Reemplaza los iconos de Feather

            const submenu = document.getElementById('serviceListSubmenu');
            const toggleSubmenuIcon = document.getElementById('toggleSubmenu');

            // Check localStorage for submenu state
            const submenuState = localStorage.getItem('submenuState');
            if (submenuState === 'show') {
                submenu.classList.add('show');
                submenu.style.display = 'flex';
            }

            toggleSubmenuIcon.addEventListener('click', function (e) {
                e.preventDefault();
                toggleSubmenu();
            });

            function toggleSubmenu() {
                if (submenu.classList.contains('show')) {
                    submenu.classList.remove('show');
                    submenu.style.display = 'none';
                    localStorage.setItem('submenuState', 'hide');
                } else {
                    submenu.classList.add('show');
                    submenu.style.display = 'flex';
                    localStorage.setItem('submenuState', 'show');
                }
            }
        });
    </script>
    `;
}

function generateServiceLinks(): string {
    const globalCacheStatsCollector = GlobalCacheStatsCollector.getInstance();
    const activeServices = Array.from(globalCacheStatsCollector.getAllStats().keys());
    return activeServices.map(service => `<a href="/cache-key-stats?service=${service}" class="nav-link services-sidebar" >${service}</a>`).join('');
}
