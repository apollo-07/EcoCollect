/**
 * EcoCollect - Citizen User Dashboard & Request Management (user.js)
 * Manages user statistics calculation, active pickup highlight card,
 * recent requests table, filter controls, and user profile management.
 */

// Initialize Citizen Dashboard
function initUserDashboard() {
    const user = requireAuth(['user']);
    if (!user) return;

    renderUserGreeting(user);
    renderUserStatsCards(user);
    renderActiveRequestHighlight(user);
    renderRecentRequestsTable(user);
}

// Personalized Welcome Greeting
function renderUserGreeting(user) {
    const greetingEl = document.getElementById('user-welcome-greeting');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let timeOfDay = 'Good morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'Good afternoon';
    else if (hour >= 17) timeOfDay = 'Good evening';

    greetingEl.textContent = `${timeOfDay}, ${user.name.split(' ')[0]}!`;
}

// Dynamically Calculate Citizen Statistics
function renderUserStatsCards(user) {
    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    const userRequests = allRequests.filter(r => r.userId === user.id);

    const totalPickups = userRequests.length;
    const completedPickups = userRequests.filter(r => r.status === 'COMPLETED');
    
    // Recycled weight in kg
    const totalRecycledKg = completedPickups.reduce((acc, curr) => acc + (curr.actualWeight || curr.estimatedWeight || 0), 0);

    // Eco points (from user profile or calculated)
    const points = user.ecoPoints || 0;

    // Average rating given by user
    const ratings = getData(STORAGE_KEYS.RATINGS, []).filter(r => r.userId === user.id);
    const avgRatingGiven = ratings.length > 0 
        ? (ratings.reduce((acc, curr) => acc + curr.overallRating, 0) / ratings.length).toFixed(1)
        : '5.0';

    // Update DOM
    const pickupsVal = document.getElementById('stat-user-pickups');
    const recycledVal = document.getElementById('stat-user-recycled');
    const pointsVal = document.getElementById('stat-user-points');
    const ratingVal = document.getElementById('stat-user-rating');

    if (pickupsVal) pickupsVal.textContent = totalPickups;
    if (recycledVal) recycledVal.textContent = `${totalRecycledKg.toFixed(1)} kg`;
    if (pointsVal) pointsVal.textContent = points.toLocaleString();
    if (ratingVal) ratingVal.textContent = `${avgRatingGiven} ★`;
}

// Active Request Highlight Card
function renderActiveRequestHighlight(user) {
    const container = document.getElementById('active-request-container');
    if (!container) return;

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    // Find active ongoing request
    const activeReq = allRequests.find(r => 
        r.userId === user.id && 
        ['ON_THE_WAY', 'ARRIVED', 'ACCEPTED', 'ASSIGNED', 'REQUESTED'].includes(r.status)
    );

    if (!activeReq) {
        container.innerHTML = `
            <div style="padding:2.5rem 1.5rem; text-align:center; color:var(--text-muted); background:#FFFFFF; border:1px dashed var(--border-color); border-radius:var(--radius-lg);">
                <div style="width:48px; height:48px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; margin:0 auto 0.75rem; font-size:1.25rem;">
                    <i class="fa-solid fa-box-open"></i>
                </div>
                <h4 style="font-weight:700; color:var(--text-main); margin-bottom:0.25rem;">No Active Pickups In Progress</h4>
                <p style="font-size:0.85rem; max-width:350px; margin:0 auto 1.25rem;">Have old electronics, batteries, or appliances lying around? Let certified recyclers pick them up from your doorstep.</p>
                <a href="request.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-calendar-plus"></i> Schedule E-Waste Pickup</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="active-request-card">
            <span class="active-request-badge badge ${getStatusBadgeClass(activeReq.status)}">
                <span class="badge-dot"></span> ${activeReq.status.replace(/_/g, ' ')}
            </span>

            <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">
                Ongoing Collection
            </div>
            <h3 style="font-size:1.25rem; font-weight:800; color:var(--text-main); margin:0.25rem 0;">
                ${activeReq.deviceName} (${activeReq.category})
            </h3>
            <p style="font-size:0.825rem; color:var(--text-muted);">
                Request ID: <strong style="color:var(--text-main);">${activeReq.id}</strong>
            </p>

            <div class="active-req-meta">
                <div>
                    <div class="active-req-item-label">Pickup Date</div>
                    <div class="active-req-item-val">${activeReq.scheduledDate}</div>
                </div>
                <div>
                    <div class="active-req-item-label">Time Window</div>
                    <div class="active-req-item-val" style="font-size:0.85rem;">${activeReq.timeSlot}</div>
                </div>
                <div>
                    <div class="active-req-item-label">Est. Weight</div>
                    <div class="active-req-item-val">${activeReq.estimatedWeight} kg</div>
                </div>
                <div>
                    <div class="active-req-item-label">Potential Points</div>
                    <div class="active-req-item-val" style="color:var(--primary); font-weight:700;">+${activeReq.potentialPoints || 45} Pts</div>
                </div>
            </div>

            ${activeReq.collectorName ? `
            <div class="collector-mini-profile">
                <img src="${activeReq.collectorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" class="collector-mini-avatar" alt="Collector">
                <div class="collector-mini-details">
                    <div class="collector-name">${activeReq.collectorName}</div>
                    <div class="collector-subtext"><i class="fa-solid fa-truck"></i> ${activeReq.collectorVehicle || 'EV Cargo'} &bull; <i class="fa-solid fa-star" style="color:#F59E0B;"></i> ${activeReq.collectorRating || 4.8}</div>
                </div>
                <a href="tel:${activeReq.collectorPhone || '+919845011223'}" class="btn btn-sm btn-outline"><i class="fa-solid fa-phone"></i></a>
            </div>
            ` : `
            <div style="background:#FEF3C7; padding:0.75rem 1rem; border-radius:var(--radius-md); font-size:0.825rem; color:#92400E; margin-bottom:1.25rem;">
                <i class="fa-solid fa-satellite-dish"></i> Dispatcher matching nearby collector in ${activeReq.zone}...
            </div>
            `}

            <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
                <div style="font-size:0.825rem; color:var(--text-muted);">
                    <i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${activeReq.address}
                </div>
                <a href="tracking.html?id=${activeReq.id}" class="btn btn-primary btn-sm">
                    <i class="fa-solid fa-location-arrow"></i> Track Live on Map
                </a>
            </div>
        </div>
    `;
}

// Render Recent Requests Table on Dashboard
function renderRecentRequestsTable(user) {
    const tbody = document.getElementById('user-recent-requests-tbody');
    if (!tbody) return;

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    const userRequests = allRequests.filter(r => r.userId === user.id).slice(0, 5);

    if (userRequests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">
                    No pickup requests scheduled yet.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = userRequests.map(r => `
        <tr>
            <td>
                <strong style="color:var(--text-main);">${r.id}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${formatRelativeTime(r.createdAt)}</div>
            </td>
            <td>
                <div style="font-weight:600;">${r.deviceName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.category} &bull; ${r.estimatedWeight} kg</div>
            </td>
            <td>
                <div>${r.scheduledDate}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.timeSlot}</div>
            </td>
            <td>
                <span class="badge ${getStatusBadgeClass(r.status)}">
                    ${r.status.replace(/_/g, ' ')}
                </span>
            </td>
            <td>
                ${r.collectorName ? `
                    <div style="font-weight:600; font-size:0.85rem;">${r.collectorName}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-star" style="color:#F59E0B;"></i> ${r.collectorRating || 4.8}</div>
                ` : `<span style="color:var(--text-light); font-size:0.8rem;">Unassigned</span>`}
            </td>
            <td>
                <div class="table-actions">
                    <a href="tracking.html?id=${r.id}" class="btn btn-sm btn-outline table-action-btn" title="Track Live">
                        <i class="fa-solid fa-location-arrow"></i> Track
                    </a>
                    ${r.status === 'COMPLETED' ? `
                    <a href="rating.html?id=${r.id}" class="btn btn-sm btn-outline-primary table-action-btn" title="Rate Service">
                        <i class="fa-solid fa-star"></i> Rate
                    </a>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Initialize My Requests List Page (requests.html)
function initUserRequestsPage() {
    const user = requireAuth(['user']);
    if (!user) return;

    renderAllUserRequests(user);
    bindUserRequestFilters(user);
}

function renderAllUserRequests(user, filterStatus = 'ALL', searchQuery = '') {
    const tbody = document.getElementById('all-user-requests-tbody');
    const countBadge = document.getElementById('user-requests-count');
    if (!tbody) return;

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    let filtered = allRequests.filter(r => r.userId === user.id);

    if (filterStatus !== 'ALL') {
        filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
            r.id.toLowerCase().includes(q) ||
            r.deviceName.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            (r.collectorName && r.collectorName.toLowerCase().includes(q))
        );
    }

    if (countBadge) countBadge.textContent = `${filtered.length} Requests`;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">
                    <i class="fa-solid fa-magnifying-glass" style="font-size:2rem; margin-bottom:0.75rem; color:var(--text-light); display:block;"></i>
                    No requests matched your filter criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(r => `
        <tr>
            <td>
                <strong style="color:var(--text-main);">${r.id}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${formatRelativeTime(r.createdAt)}</div>
            </td>
            <td>
                <div style="font-weight:600;">${r.deviceName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.category} &bull; Qty: ${r.quantity}</div>
            </td>
            <td>
                <span style="font-weight:600;">${r.actualWeight || r.estimatedWeight} kg</span>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.condition}</div>
            </td>
            <td>
                <div>${r.scheduledDate}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.timeSlot}</div>
            </td>
            <td>
                <span class="badge ${getStatusBadgeClass(r.status)}">
                    ${r.status.replace(/_/g, ' ')}
                </span>
            </td>
            <td>
                ${r.collectorName ? `
                    <div style="font-weight:600; font-size:0.85rem;">${r.collectorName}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${r.collectorVehicle || 'EV Cargo'}</div>
                ` : `<span style="color:var(--text-light); font-size:0.8rem;">Pending match</span>`}
            </td>
            <td>
                <div class="table-actions">
                    <a href="tracking.html?id=${r.id}" class="btn btn-sm btn-outline table-action-btn" title="Track Request">
                        <i class="fa-solid fa-location-crosshairs"></i> Track
                    </a>
                    ${r.status === 'COMPLETED' ? `
                    <a href="rating.html?id=${r.id}" class="btn btn-sm btn-primary table-action-btn" title="Rate Experience">
                        <i class="fa-solid fa-star"></i> Rate
                    </a>` : ''}
                    ${['REQUESTED', 'ASSIGNED'].includes(r.status) ? `
                    <button class="btn btn-sm btn-outline table-action-btn" style="color:var(--danger);" onclick="cancelActiveRequest('${r.id}'); initUserRequestsPage();" title="Cancel">
                        <i class="fa-solid fa-xmark"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function bindUserRequestFilters(user) {
    const statusSelect = document.getElementById('filter-request-status');
    const searchInput = document.getElementById('filter-request-search');

    function applyFilter() {
        const status = statusSelect ? statusSelect.value : 'ALL';
        const query = searchInput ? searchInput.value.trim() : '';
        renderAllUserRequests(user, status, query);
    }

    if (statusSelect) statusSelect.addEventListener('change', applyFilter);
    if (searchInput) searchInput.addEventListener('input', applyFilter);
}

// User Profile Management (profile.html)
function initUserProfile() {
    const user = requireAuth(['user']);
    if (!user) return;

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const addressInput = document.getElementById('profile-address');
    const areaInput = document.getElementById('profile-area');
    const zoneSelect = document.getElementById('profile-zone');
    const pincodeInput = document.getElementById('profile-pincode');
    const form = document.getElementById('user-profile-form');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (addressInput) addressInput.value = user.address || '';
    if (areaInput) areaInput.value = user.area || '';
    if (zoneSelect) zoneSelect.value = user.zone || 'Central Zone';
    if (pincodeInput) pincodeInput.value = user.pincode || '';

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            user.name = nameInput.value.trim();
            user.phone = phoneInput.value.trim();
            user.address = addressInput.value.trim();
            user.area = areaInput.value.trim();
            user.zone = zoneSelect.value;
            user.pincode = pincodeInput.value.trim();

            setCurrentUser(user);
            updateData(STORAGE_KEYS.USERS, user.id, user);

            showToast('Profile Updated', 'Your profile details have been saved.', 'success');
        });
    }
}
