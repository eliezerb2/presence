document.addEventListener('DOMContentLoaded', () => {
    const kioskBtn = document.getElementById('kiosk-btn');
    const managerBtn = document.getElementById('manager-btn');
    const appContent = document.getElementById('app-content');

    const loadKiosk = async () => {
        const response = await fetch('kiosk.html');
        const html = await response.text();
        appContent.innerHTML = html;
        // Re-run kiosk.js logic after content is loaded
        if (typeof initializeKiosk === 'function') {
            initializeKiosk();
        }
    };

    const loadManager = async () => {
        const response = await fetch('manager.html');
        const html = await response.text();
        appContent.innerHTML = html;
        // Re-run manager.js logic after content is loaded
        if (typeof initializeManager === 'function') {
            initializeManager();
        }
    };

    kioskBtn.addEventListener('click', loadKiosk);
    managerBtn.addEventListener('click', loadManager);

    // Load kiosk by default
    loadKiosk();
});
