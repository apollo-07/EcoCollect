/**
 * EcoCollect - Authentication & Session Module (auth.js)
 * Manages user sessions, prototype login/registration, role-based access control,
 * and quick demo role switching.
 */

// Helper to get root-relative or page-relative paths safely
function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/user/') || path.includes('/collector/') || path.includes('/admin/')) {
        return '../';
    }
    return './';
}

// Current User State Management
function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
        // By default, if not logged in yet on demo, default to demo citizen for smooth exploration
        // but mark as demo guest
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function setCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
}

// Prototype Authentication
function login(email, password) {
    if (!email || !password) {
        return { success: false, message: 'Please provide both email and password.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check users and admin
    const users = getData(STORAGE_KEYS.USERS, []);
    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (matchedUser) {
        if (matchedUser.password === password) {
            setCurrentUser(matchedUser);
            return { success: true, user: matchedUser };
        } else {
            return { success: false, message: 'Invalid credentials. For demo, use password: demo123' };
        }
    }

    // Check collectors
    const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
    const matchedCollector = collectors.find(c => c.email.toLowerCase() === cleanEmail);

    if (matchedCollector) {
        if (matchedCollector.password === password) {
            setCurrentUser(matchedCollector);
            return { success: true, user: matchedCollector };
        } else {
            return { success: false, message: 'Invalid credentials. For demo, use password: demo123' };
        }
    }

    return { success: false, message: 'Account not found. Please register or use a demo account.' };
}

function register(formData) {
    const { name, email, password, phone, role, address, area, zone, pincode } = formData;

    if (!name || !email || !password) {
        return { success: false, message: 'Name, email, and password are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicates
    const users = getData(STORAGE_KEYS.USERS, []);
    const collectors = getData(STORAGE_KEYS.COLLECTORS, []);

    if (users.some(u => u.email.toLowerCase() === cleanEmail) || collectors.some(c => c.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: 'An account with this email already exists.' };
    }

    if (role === 'collector') {
        const newCollector = {
            id: `COL-${String(collectors.length + 1).padStart(3, '0')}`,
            name,
            email: cleanEmail,
            password,
            role: 'collector',
            phone: phone || '+91 98000 00000',
            status: 'AVAILABLE',
            rating: 5.0,
            ratingsCount: 0,
            completedPickups: 0,
            activeRequestsCount: 0,
            maxWorkload: 5,
            vehicle: formData.vehicle || 'Standard EV Cargo (KA-01-EV-0001)',
            vehicleType: 'EV Cargo (Capacity: 500 kg)',
            zone: zone || 'Central Zone',
            lat: 12.9716,
            lng: 77.5946,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television',
                'Printer', 'Keyboard', 'Mouse', 'Battery', 'Charger', 'Other'
            ],
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
            joinedDate: new Date().toISOString().split('T')[0],
            avgResponseMinutes: 20,
            totalKgCollected: 0
        };
        collectors.push(newCollector);
        saveData(STORAGE_KEYS.COLLECTORS, collectors);
        setCurrentUser(newCollector);
        return { success: true, user: newCollector };
    } else {
        const newUser = {
            id: `USR-${String(users.length + 1).padStart(3, '0')}`,
            name,
            email: cleanEmail,
            password,
            role: 'user',
            phone: phone || '+91 98000 00000',
            address: address || 'Metro City Residence',
            city: 'Metro City',
            area: area || 'Central',
            zone: zone || 'Central Zone',
            pincode: pincode || '560001',
            lat: 12.9716,
            lng: 77.5946,
            ecoPoints: 50, // Welcome signup bonus!
            totalWasteKg: 0,
            pickupsCount: 0,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveData(STORAGE_KEYS.USERS, users);
        setCurrentUser(newUser);

        // Add welcome notification
        const notifications = getData(STORAGE_KEYS.NOTIFICATIONS, []);
        notifications.unshift({
            id: generateId('NOTIF'),
            userId: newUser.id,
            role: 'user',
            title: 'Welcome to EcoCollect! 🌱',
            message: 'You have been awarded 50 Welcome Eco Points. Schedule your first doorstep pickup today!',
            type: 'points',
            link: '/user/request.html',
            read: false,
            createdAt: new Date().toISOString()
        });
        saveData(STORAGE_KEYS.NOTIFICATIONS, notifications);

        return { success: true, user: newUser };
    }
}

function logout() {
    setCurrentUser(null);
    const base = getBasePath();
    window.location.href = `${base}login.html`;
}

// Quick Demo Role Switcher
function switchDemoRole(targetRole) {
    if (targetRole === 'user') {
        const users = getData(STORAGE_KEYS.USERS, []);
        const demoUser = users.find(u => u.email === 'user@ecocollect.demo') || users[0];
        setCurrentUser(demoUser);
        window.location.href = `${getBasePath()}user/dashboard.html`;
    } else if (targetRole === 'collector') {
        const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
        const demoCollector = collectors.find(c => c.email === 'collector@ecocollect.demo') || collectors[0];
        setCurrentUser(demoCollector);
        window.location.href = `${getBasePath()}collector/dashboard.html`;
    } else if (targetRole === 'admin') {
        const users = getData(STORAGE_KEYS.USERS, []);
        const demoAdmin = users.find(u => u.role === 'admin') || {
            id: 'USR-ADMIN',
            name: 'Metropolitan Admin',
            email: 'admin@ecocollect.demo',
            role: 'admin'
        };
        setCurrentUser(demoAdmin);
        window.location.href = `${getBasePath()}admin/dashboard.html`;
    }
}

// Page Guard
function requireAuth(allowedRoles = []) {
    let user = getCurrentUser();

    // Auto-login fallback for immediate evaluation if no user is set
    if (!user) {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/collector/')) {
            const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
            user = collectors[0];
            setCurrentUser(user);
        } else if (currentPath.includes('/admin/')) {
            const users = getData(STORAGE_KEYS.USERS, []);
            user = users.find(u => u.role === 'admin') || users[users.length - 1];
            setCurrentUser(user);
        } else if (currentPath.includes('/user/')) {
            const users = getData(STORAGE_KEYS.USERS, []);
            user = users[0];
            setCurrentUser(user);
        } else {
            return null;
        }
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to their respective authorized home
        const base = getBasePath();
        if (user.role === 'admin') {
            window.location.href = `${base}admin/dashboard.html`;
        } else if (user.role === 'collector') {
            window.location.href = `${base}collector/dashboard.html`;
        } else {
            window.location.href = `${base}user/dashboard.html`;
        }
        return null;
    }

    return user;
}

// XSS Sanitizer for DOM injection
function sanitizeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
