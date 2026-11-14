/**
 * EcoCollect - Global Application Shell & UI Controller (app.js)
 * Manages header, sidebar, toast notifications, notification drawer,
 * demo switcher bar, and shared modals across all pages.
 */

// Toast Notification System
function showToast(title, message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    else if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    else if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${sanitizeHTML(title)}</div>
            <div class="toast-message">${sanitizeHTML(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// Modal Dialog Helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Render Demo Top Banner on Dashboard Pages
function renderDemoBanner(activeRole) {
    const existing = document.querySelector('.demo-banner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.className = 'demo-banner';
    banner.innerHTML = `
        <div class="demo-banner-title">
            <i class="fa-solid fa-seedling"></i>
            <strong>EcoCollect Prototype Demo</strong>
            <span style="opacity: 0.85;">— Switch roles instantly to test all workflows:</span>
        </div>
        <div class="demo-pills">
            <button class="demo-pill ${activeRole === 'user' ? 'active' : ''}" onclick="switchDemoRole('user')">
                <i class="fa-solid fa-user"></i> Citizen View
            </button>
            <button class="demo-pill ${activeRole === 'collector' ? 'active' : ''}" onclick="switchDemoRole('collector')">
                <i class="fa-solid fa-truck"></i> Collector View
            </button>
            <button class="demo-pill ${activeRole === 'admin' ? 'active' : ''}" onclick="switchDemoRole('admin')">
                <i class="fa-solid fa-shield-halved"></i> Admin Console
            </button>
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
}

// Initialize Notifications Drawer
function setupNotifications(currentUser) {
    const bellBtn = document.getElementById('notif-bell-btn');
    const dropdown = document.getElementById('notif-dropdown');
    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');

    if (!bellBtn || !dropdown || !list) return;

    // Load notifications for this role or user
    const allNotifs = getData(STORAGE_KEYS.NOTIFICATIONS, []);
    const userNotifs = allNotifs.filter(n =>
        n.userId === currentUser.id ||
        (n.role && n.role === currentUser.role) ||
        (!n.userId && !n.role)
    );

    const unreadCount = userNotifs.filter(n => !n.read).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    if (userNotifs.length === 0) {
        list.innerHTML = `
            <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                <i class="fa-regular fa-bell-slash" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                No notifications right now.
            </div>
        `;
    } else {
        list.innerHTML = userNotifs.slice(0, 6).map(n => {
            const basePath = getBasePath();
            const link = n.link ? (n.link.startsWith('/') ? basePath + n.link.substring(1) : n.link) : '#';
            return `
                <a href="${link}" class="notif-item ${!n.read ? 'unread' : ''}" onclick="markNotifRead('${n.id}')">
                    <div class="notif-icon"><i class="fa-solid ${n.type === 'points' ? 'fa-coins' : n.type === 'tracking' ? 'fa-truck-fast' : 'fa-bell'}"></i></div>
                    <div class="notif-body">
                        <div class="notif-msg-title">${sanitizeHTML(n.title)}</div>
                        <div class="notif-msg-text">${sanitizeHTML(n.message)}</div>
                        <div class="notif-time">${formatRelativeTime(n.createdAt)}</div>
                    </div>
                </a>
            `;
        }).join('');
    }

    // Toggle dropdown
    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

function markNotifRead(notifId) {
    const list = getData(STORAGE_KEYS.NOTIFICATIONS, []);
    const item = list.find(n => n.id === notifId);
    if (item) {
        item.read = true;
        saveData(STORAGE_KEYS.NOTIFICATIONS, list);
    }
}

function markAllNotificationsRead() {
    const list = getData(STORAGE_KEYS.NOTIFICATIONS, []);
    list.forEach(n => n.read = true);
    saveData(STORAGE_KEYS.NOTIFICATIONS, list);
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    showToast('Success', 'All notifications marked as read', 'info');
}

// Relative Time Formatter
function formatRelativeTime(isoString) {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const diffMs = new Date() - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Mobile Sidebar Toggle Setup
function setupMobileSidebar() {
    const toggleBtn = document.querySelector('.mobile-nav-toggle');
    const sidebar = document.querySelector('.app-sidebar');

    if (!toggleBtn || !sidebar) return;

    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    });
}

// Common App Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if on authenticated page
    const user = getCurrentUser();
    if (user) {
        renderDemoBanner(user.role);
        setupNotifications(user);
        setupMobileSidebar();

        // Bind user info to mini avatar/name if present
        document.querySelectorAll('.user-display-name').forEach(el => el.textContent = user.name);
        document.querySelectorAll('.user-display-email').forEach(el => el.textContent = user.email);
        document.querySelectorAll('.user-display-role').forEach(el => el.textContent = user.role);
        document.querySelectorAll('.user-display-avatar').forEach(el => {
            if (user.avatar) el.src = user.avatar;
        });
    }
});
