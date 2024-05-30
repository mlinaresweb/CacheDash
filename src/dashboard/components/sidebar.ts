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
        <a href="/dashboard" class="nav-link" data-pjax><i class="icono-sidebar" data-feather="activity"></i> Dashboard</a>
        <a href="/cache-key-stats" class="nav-link" data-pjax><i class="icono-sidebar" data-feather="list"></i> Service Lists <i data-feather="chevron-down" id="toggleSubmenu" aria-expanded="false" style="margin-left: 51px;"></i></a>
        <div id="serviceListSubmenu">
            ${serviceLinksHtml}
        </div>
        <a href="/logs" class="nav-link" data-pjax><i class="icono-sidebar" data-feather="file-text"></i> Logs</a>
        <a href="/settings" class="nav-link" data-pjax><i class="icono-sidebar" data-feather="settings"></i> Settings</a>
    </div>
    <div class="mobile-menu">
        <a href="/dashboard" class="nav-link"><i data-feather="activity"></i> Dashboard</a>
        <a href="/cache-key-stats" class="nav-link"><i data-feather="list"></i> Service Lists</a>
        <a href="/logs" class="nav-link"><i data-feather="file-text"></i> Logs</a>
        <a href="/settings" class="nav-link"><i data-feather="settings"></i> Settings</a>
    </div>
    <script src="https://unpkg.com/feather-icons"></script>
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>
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
    const activeServices = Array.from(globalCacheStatsCollector.getAllStats().keys()).slice(0, 5); // Mostrar un máximo de 5 servicios
    return activeServices.map(service => `<a href="/cache-key-stats?service=${service}" class="nav-link services-sidebar" data-pjax>${service}</a>`).join('');
}
