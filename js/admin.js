/**
 * EcoCollect - Admin Dashboard & System Operations (admin.js)
 * Manages high-level platform statistics, user management, collector fleet oversight,
 * request administration with multi-criteria filters, and manual dispatcher overrides.
 */

// Initialize Admin Dashboard Overview
function initAdminDashboard() {
    const admin = requireAuth(['admin']);
    if (!admin) return;

    renderAdminMetrics();
    renderRecentActivityStream();
    if (window.renderAllAnalyticsCharts) {
        window.renderAllAnalyticsCharts();
    }
}

// Compute Dynamic Administrative Metrics
function renderAdminMetrics() {
    const users = getData(STORAGE_KEYS.USERS, []).filter(u => u.role !== 'admin');
    const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
    const requests = getData(STORAGE_KEYS.REQUESTS, []);
    const ratings = getData(STORAGE_KEYS.RATINGS, []);

    const totalUsers = users.length;
    const totalCollectors = collectors.length;
    const totalRequests = requests.length;
    const completedPickups = requests.filter(r => r.status === 'COMPLETED').length;
    const pendingPickups = requests.filter(r => ['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(r.status)).length;

    // Total E-Waste Collected in kg
    const totalWasteKg = requests
        .filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + (r.actualWeight || r.estimatedWeight || 0), 0);

    // Average Platform Rating
    const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + (r.overallRating || 5), 0) / ratings.length).toFixed(2)
        : '4.85';

    // DOM Binding
    const usersEl = document.getElementById('metric-total-users');
    const collectorsEl = document.getElementById('metric-total-collectors');
    const requestsEl = document.getElementById('metric-total-requests');
    const completedEl = document.getElementById('metric-completed-pickups');
    const pendingEl = document.getElementById('metric-pending-pickups');
    const wasteEl = document.getElementById('metric-total-waste');
    const ratingEl = document.getElementById('metric-platform-rating');

    if (usersEl) usersEl.textContent = totalUsers;
    if (collectorsEl) collectorsEl.textContent = totalCollectors;
    if (requestsEl) requestsEl.textContent = totalRequests;
    if (completedEl) completedEl.textContent = completedPickups;
    if (pendingEl) pendingEl.textContent = pendingPickups;
    if (wasteEl) wasteEl.textContent = `${totalWasteKg.toFixed(1)} kg`;
    if (ratingEl) ratingEl.textContent = `${avgRating} ★`;
}

// Render Recent System Activity Feed
function renderRecentActivityStream() {
    const container = document.getElementById('admin-activity-stream');
    if (!container) return;

    const requests = getData(STORAGE_KEYS.REQUESTS, []).slice(0, 7);

    container.innerHTML = requests.map(r => {
        let icon = 'fa-file-lines';
        let color = '#3B82F6';
        let text = `New request scheduled: ${r.deviceName} (${r.category})`;

        if (r.status === 'COMPLETED') {
            icon = 'fa-check-double';
            color = '#16A34A';
            text = `Pickup verified & completed: ${r.actualWeight || r.estimatedWeight} kg e-waste diverted`;
        } else if (r.status === 'ON_THE_WAY') {
            icon = 'fa-truck-fast';
            color = '#F59E0B';
            text = `${r.collectorName} en route to ${r.area || r.zone}`;
        }

        return `
            <div style="display:flex; align-items:flex-start; gap:0.75rem; padding:0.85rem 0; border-bottom:1px solid var(--border-color);">
                <div style="width:32px; height:32px; border-radius:50%; background:#F1F5F9; color:${color}; display:flex; align-items:center; justify-content:center; font-size:0.85rem; flex-shrink:0;">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:0.85rem; font-weight:600; color:var(--text-main);">${text}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                        ${r.id} &bull; ${r.userName} (${r.zone}) &bull; ${formatRelativeTime(r.createdAt)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Admin Users Management (admin/users.html)
function initAdminUsersPage() {
    const admin = requireAuth(['admin']);
    if (!admin) return;

    renderAdminUsersTable();
    bindAdminUserFilters();
}

function renderAdminUsersTable(searchQuery = '', zoneFilter = 'ALL') {
    const tbody = document.getElementById('admin-users-tbody');
    const countBadge = document.getElementById('admin-users-count');
    if (!tbody) return;

    const allUsers = getData(STORAGE_KEYS.USERS, []).filter(u => u.role !== 'admin');
    let filtered = allUsers;

    if (zoneFilter !== 'ALL') {
        filtered = filtered.filter(u => u.zone === zoneFilter);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(u => 
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.includes(q)) ||
            (u.area && u.area.toLowerCase().includes(q))
        );
    }

    if (countBadge) countBadge.textContent = `${filtered.length} Registered Citizens`;

    tbody.innerHTML = filtered.map(u => `
        <tr>
            <td>
                <div class="table-user-cell">
                    <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="table-user-avatar" alt="Avatar">
                    <div>
                        <div class="table-user-name">${u.name}</div>
                        <div class="table-user-subtext">${u.email}</div>
                    </div>
                </div>
            </td>
            <td>${u.phone || 'N/A'}</td>
            <td>
                <div>${u.area || 'Metro Area'}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${u.zone} &bull; ${u.pincode}</div>
            </td>
            <td>
                <span class="badge badge-success"><i class="fa-solid fa-coins"></i> ${u.ecoPoints || 0} Pts</span>
            </td>
            <td>
                <span style="font-weight:600;">${u.totalWasteKg || 0} kg</span>
                <div style="font-size:0.75rem; color:var(--text-muted);">${u.pickupsCount || 0} pickups</div>
            </td>
            <td>
                <span class="badge badge-primary">ACTIVE</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="inspectUserDetails('${u.id}')">
                    <i class="fa-solid fa-eye"></i> Details
                </button>
            </td>
        </tr>
    `).join('');
}

function bindAdminUserFilters() {
    const searchInput = document.getElementById('admin-users-search');
    const zoneSelect = document.getElementById('admin-users-zone-filter');

    function apply() {
        renderAdminUsersTable(searchInput?.value.trim(), zoneSelect?.value);
    }

    if (searchInput) searchInput.addEventListener('input', apply);
    if (zoneSelect) zoneSelect.addEventListener('change', apply);
}

function inspectUserDetails(userId) {
    const users = getData(STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    const userReqs = allRequests.filter(r => r.userId === user.id);

    let modal = document.getElementById('admin-inspector-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-inspector-modal';
        modal.className = 'modal-backdrop';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title"><i class="fa-solid fa-user-circle" style="color:var(--primary);"></i> Citizen Profile: ${user.name}</h3>
                <button class="modal-close-btn" onclick="closeModal('admin-inspector-modal')">&times;</button>
            </div>
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
                <img src="${user.avatar}" style="width:60px; height:60px; border-radius:50%; object-fit:cover;" alt="User">
                <div>
                    <h4>${user.name}</h4>
                    <div style="font-size:0.85rem; color:var(--text-muted);">${user.email} &bull; ${user.phone}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${user.address}, ${user.area} (${user.zone})</div>
                </div>
            </div>

            <div class="stats-grid" style="grid-template-columns:repeat(3, 1fr); gap:0.75rem; margin-bottom:1.25rem;">
                <div style="background:#F8FAFC; padding:0.75rem; border-radius:var(--radius-md); text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Eco Points</div>
                    <div style="font-size:1.2rem; font-weight:800; color:var(--primary);">${user.ecoPoints}</div>
                </div>
                <div style="background:#F8FAFC; padding:0.75rem; border-radius:var(--radius-md); text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">E-Waste Total</div>
                    <div style="font-size:1.2rem; font-weight:800; color:var(--text-main);">${user.totalWasteKg} kg</div>
                </div>
                <div style="background:#F8FAFC; padding:0.75rem; border-radius:var(--radius-md); text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total Pickups</div>
                    <div style="font-size:1.2rem; font-weight:800; color:var(--text-main);">${userReqs.length}</div>
                </div>
            </div>

            <h5 style="font-size:0.85rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem;">Recent Pickups by Citizen</h5>
            <div style="max-height:180px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md);">
                ${userReqs.map(r => `
                    <div style="padding:0.5rem 0.75rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; font-size:0.8rem;">
                        <span><strong>${r.id}</strong>: ${r.deviceName} (${r.category})</span>
                        <span class="badge ${getStatusBadgeClass(r.status)}">${r.status}</span>
                    </div>
                `).join('')}
            </div>

            <div class="modal-footer">
                <button class="btn btn-outline" onclick="closeModal('admin-inspector-modal')">Close</button>
            </div>
        </div>
    `;

    openModal('admin-inspector-modal');
}

// Admin Collectors Management (admin/collectors.html)
function initAdminCollectorsPage() {
    const admin = requireAuth(['admin']);
    if (!admin) return;

    renderAdminCollectorsTable();
    bindAdminCollectorFilters();
}

function renderAdminCollectorsTable(searchQuery = '', statusFilter = 'ALL', zoneFilter = 'ALL') {
    const tbody = document.getElementById('admin-collectors-tbody');
    const countBadge = document.getElementById('admin-collectors-count');
    if (!tbody) return;

    const allCollectors = getData(STORAGE_KEYS.COLLECTORS, []);
    let filtered = allCollectors;

    if (statusFilter !== 'ALL') {
        filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (zoneFilter !== 'ALL') {
        filtered = filtered.filter(c => c.zone === zoneFilter);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.vehicle.toLowerCase().includes(q) ||
            c.zone.toLowerCase().includes(q)
        );
    }

    if (countBadge) countBadge.textContent = `${filtered.length} Fleet Agents`;

    tbody.innerHTML = filtered.map(c => `
        <tr>
            <td>
                <div class="table-user-cell">
                    <img src="${c.avatar}" class="table-user-avatar" alt="Avatar">
                    <div>
                        <div class="table-user-name">${c.name}</div>
                        <div class="table-user-subtext">${c.email} &bull; ${c.phone}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge ${c.status === 'AVAILABLE' ? 'badge-success' : c.status === 'BUSY' ? 'badge-warning' : 'badge-neutral'}">
                    ${c.status}
                </span>
            </td>
            <td>
                <div>${c.vehicle}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${c.vehicleType}</div>
            </td>
            <td>${c.zone}</td>
            <td>
                <div style="font-weight:700; color:#B45309;"><i class="fa-solid fa-star"></i> ${c.rating}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${c.completedPickups} pickups</div>
            </td>
            <td>
                <span class="badge ${c.activeRequestsCount > 0 ? 'badge-info' : 'badge-neutral'}">
                    ${c.activeRequestsCount || 0} / ${c.maxWorkload} Tasks
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="inspectCollectorDetails('${c.id}')">
                    <i class="fa-solid fa-pen-to-square"></i> Manage
                </button>
            </td>
        </tr>
    `).join('');
}

function bindAdminCollectorFilters() {
    const searchInput = document.getElementById('admin-collectors-search');
    const statusSelect = document.getElementById('admin-collectors-status-filter');
    const zoneSelect = document.getElementById('admin-collectors-zone-filter');

    function apply() {
        renderAdminCollectorsTable(searchInput?.value.trim(), statusSelect?.value, zoneSelect?.value);
    }

    if (searchInput) searchInput.addEventListener('input', apply);
    if (statusSelect) statusSelect.addEventListener('change', apply);
    if (zoneSelect) zoneSelect.addEventListener('change', apply);
}

function inspectCollectorDetails(colId) {
    const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
    const c = collectors.find(col => col.id === colId);
    if (!c) return;

    let modal = document.getElementById('admin-collector-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-collector-modal';
        modal.className = 'modal-backdrop';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title"><i class="fa-solid fa-truck" style="color:var(--primary);"></i> Agent: ${c.name}</h3>
                <button class="modal-close-btn" onclick="closeModal('admin-collector-modal')">&times;</button>
            </div>
            
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
                <img src="${c.avatar}" style="width:58px; height:58px; border-radius:50%; object-fit:cover;" alt="Collector">
                <div>
                    <h4>${c.name}</h4>
                    <div style="font-size:0.85rem; color:var(--text-muted);">${c.vehicle} (${c.vehicleType})</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Assigned Zone: <strong>${c.zone}</strong></div>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Override Availability Status</label>
                <select id="modal-collector-status" class="form-control">
                    <option value="AVAILABLE" ${c.status === 'AVAILABLE' ? 'selected' : ''}>AVAILABLE</option>
                    <option value="BUSY" ${c.status === 'BUSY' ? 'selected' : ''}>BUSY</option>
                    <option value="OFFLINE" ${c.status === 'OFFLINE' ? 'selected' : ''}>OFFLINE</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Primary Zone</label>
                <select id="modal-collector-zone" class="form-control">
                    ${METRO_ZONES.map(z => `<option value="${z}" ${c.zone === z ? 'selected' : ''}>${z}</option>`).join('')}
                </select>
            </div>

            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">
                <strong>Supported E-Waste Specializations:</strong>
                <p style="margin-top:4px;">${c.supportedCategories.join(', ')}</p>
            </div>

            <div class="modal-footer">
                <button class="btn btn-outline" onclick="closeModal('admin-collector-modal')">Cancel</button>
                <button class="btn btn-primary" onclick="saveAdminCollectorEdit('${c.id}')">Save Changes</button>
            </div>
        </div>
    `;

    openModal('admin-collector-modal');
}

function saveAdminCollectorEdit(colId) {
    const status = document.getElementById('modal-collector-status')?.value;
    const zone = document.getElementById('modal-collector-zone')?.value;

    updateData(STORAGE_KEYS.COLLECTORS, colId, { status, zone });
    closeModal('admin-collector-modal');
    showToast('Agent Updated', 'Collector status & zone modified.', 'success');
    renderAdminCollectorsTable();
}

// Admin Pickup Requests Management with Multi-Criteria Filters (admin/requests.html)
function initAdminRequestsPage() {
    const admin = requireAuth(['admin']);
    if (!admin) return;

    renderAdminRequestsTable();
    bindAdminRequestFilters();
}

function renderAdminRequestsTable(query = '', status = 'ALL', category = 'ALL', zone = 'ALL') {
    const tbody = document.getElementById('admin-requests-tbody');
    const countBadge = document.getElementById('admin-requests-count');
    if (!tbody) return;

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    let filtered = allRequests;

    if (status !== 'ALL') {
        filtered = filtered.filter(r => r.status === status);
    }
    if (category !== 'ALL') {
        filtered = filtered.filter(r => r.category === category);
    }
    if (zone !== 'ALL') {
        filtered = filtered.filter(r => r.zone === zone);
    }
    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(r => 
            r.id.toLowerCase().includes(q) ||
            r.userName.toLowerCase().includes(q) ||
            r.deviceName.toLowerCase().includes(q) ||
            (r.collectorName && r.collectorName.toLowerCase().includes(q))
        );
    }

    if (countBadge) countBadge.textContent = `${filtered.length} Requests Listed`;

    tbody.innerHTML = filtered.map(r => `
        <tr>
            <td>
                <strong style="color:var(--text-main);">${r.id}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${formatRelativeTime(r.createdAt)}</div>
            </td>
            <td>
                <div style="font-weight:600;">${r.userName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.userPhone}</div>
            </td>
            <td>
                <div style="font-weight:600;">${r.deviceName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.category} &bull; ${r.actualWeight || r.estimatedWeight} kg</div>
            </td>
            <td>
                <div>${r.area || 'Metro Area'}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.zone}</div>
            </td>
            <td>
                <span class="badge ${getStatusBadgeClass(r.status)}">${r.status.replace(/_/g, ' ')}</span>
            </td>
            <td>
                ${r.collectorName ? `
                    <div style="font-weight:600; font-size:0.85rem;">${r.collectorName}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${r.collectorVehicle}</div>
                ` : `<span class="badge badge-warning">UNASSIGNED</span>`}
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline table-action-btn" onclick="openAdminRequestDetail('${r.id}')">
                        <i class="fa-solid fa-sliders"></i> Dispatch
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function bindAdminRequestFilters() {
    const searchInput = document.getElementById('admin-requests-search');
    const statusSelect = document.getElementById('admin-requests-filter-status');
    const catSelect = document.getElementById('admin-requests-filter-category');
    const zoneSelect = document.getElementById('admin-requests-filter-zone');

    function apply() {
        renderAdminRequestsTable(
            searchInput?.value.trim(),
            statusSelect?.value,
            catSelect?.value,
            zoneSelect?.value
        );
    }

    if (searchInput) searchInput.addEventListener('input', apply);
    if (statusSelect) statusSelect.addEventListener('change', apply);
    if (catSelect) catSelect.addEventListener('change', apply);
    if (zoneSelect) zoneSelect.addEventListener('change', apply);
}

function openAdminRequestDetail(reqId) {
    const requests = getData(STORAGE_KEYS.REQUESTS, []);
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    const collectors = getData(STORAGE_KEYS.COLLECTORS, []);

    let modal = document.getElementById('admin-request-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-request-modal';
        modal.className = 'modal-backdrop';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title"><i class="fa-solid fa-box-archive" style="color:var(--primary);"></i> Request: ${req.id}</h3>
                <button class="modal-close-btn" onclick="closeModal('admin-request-modal')">&times;</button>
            </div>

            <div style="background:#F8FAFC; padding:1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-size:0.85rem;">
                <p><strong>Citizen:</strong> ${req.userName} (${req.userPhone})</p>
                <p><strong>Address:</strong> ${req.address}, ${req.area} (${req.zone})</p>
                <p><strong>Item:</strong> ${req.deviceName} &bull; ${req.category} &bull; Condition: ${req.condition}</p>
                <p><strong>Scheduled:</strong> ${req.scheduledDate} &bull; ${req.timeSlot}</p>
            </div>

            <div class="form-group">
                <label class="form-label">Update Status</label>
                <select id="modal-req-status" class="form-control">
                    ${['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'COLLECTED', 'COMPLETED', 'CANCELLED'].map(st => `
                        <option value="${st}" ${req.status === st ? 'selected' : ''}>${st.replace(/_/g, ' ')}</option>
                    `).join('')}
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Assign / Reassign Collector</label>
                <select id="modal-req-collector" class="form-control">
                    <option value="">-- No Collector Assigned --</option>
                    ${collectors.map(c => `
                        <option value="${c.id}" ${req.collectorId === c.id ? 'selected' : ''}>
                            ${c.name} (${c.zone} &bull; ★ ${c.rating} &bull; ${c.status})
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="modal-footer">
                <button class="btn btn-outline" onclick="closeModal('admin-request-modal')">Cancel</button>
                <button class="btn btn-primary" onclick="saveAdminRequestEdit('${req.id}')">Apply Dispatch</button>
            </div>
        </div>
    `;

    openModal('admin-request-modal');
}

function saveAdminRequestEdit(reqId) {
    const status = document.getElementById('modal-req-status')?.value;
    const collectorId = document.getElementById('modal-req-collector')?.value;

    const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
    const col = collectors.find(c => c.id === collectorId);

    const updatePayload = {
        status,
        collectorId: col ? col.id : null,
        collectorName: col ? col.name : null,
        collectorPhone: col ? col.phone : null,
        collectorVehicle: col ? col.vehicle : null,
        collectorRating: col ? col.rating : null
    };

    updateData(STORAGE_KEYS.REQUESTS, reqId, updatePayload);
    closeModal('admin-request-modal');
    showToast('Dispatch Updated', `Request ${reqId} updated successfully.`, 'success');
    renderAdminRequestsTable();
}
