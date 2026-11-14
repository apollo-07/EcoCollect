/**
 * EcoCollect - E-Waste Collection Agent Controller (collector.js)
 * Manages collector dashboard, status availability toggle (AVAILABLE, BUSY, OFFLINE),
 * assigned requests, accept/reject, in-field pickup workflow, weighing & collection proof,
 * and completion.
 */

// Initialize Collector Dashboard
function initCollectorDashboard() {
    const collector = requireAuth(['collector', 'admin']);
    if (!collector) return;

    renderCollectorStatusToggle(collector);
    renderCollectorStats(collector);
    renderCollectorAssignedRequests(collector);
    renderAvailableZoneRequests(collector);
}

// Collector Availability Switcher (AVAILABLE / BUSY / OFFLINE)
function renderCollectorStatusToggle(collector) {
    const container = document.getElementById('collector-status-switcher');
    if (!container) return;

    const statuses = ['AVAILABLE', 'BUSY', 'OFFLINE'];

    container.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; background:#FFFFFF; border:1px solid var(--border-color); padding:0.35rem; border-radius:var(--radius-md);">
            <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); margin-left:0.5rem;">
                Status:
            </span>
            ${statuses.map(st => `
                <button class="btn btn-sm ${collector.status === st ? (st === 'AVAILABLE' ? 'btn-primary' : st === 'BUSY' ? 'btn-secondary' : 'btn-outline') : 'btn-outline'}" 
                        onclick="updateCollectorStatus('${st}')"
                        style="${collector.status === st ? 'font-weight:700;' : 'opacity:0.75;'}">
                    <span class="badge-dot" style="background:${st === 'AVAILABLE' ? '#10B981' : st === 'BUSY' ? '#F59E0B' : '#EF4444'};"></span>
                    ${st}
                </button>
            `).join('')}
        </div>
    `;
}

function updateCollectorStatus(newStatus) {
    const collector = getCurrentUser();
    if (!collector) return;

    collector.status = newStatus;
    setCurrentUser(collector);
    updateData(STORAGE_KEYS.COLLECTORS, collector.id, { status: newStatus });

    renderCollectorStatusToggle(collector);
    showToast('Status Updated', `You are now marked as ${newStatus}`, 'info');
}

// Dynamic Collector Performance Statistics
function renderCollectorStats(collector) {
    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    const myRequests = allRequests.filter(r => r.collectorId === collector.id);

    const completedPickups = myRequests.filter(r => r.status === 'COMPLETED');
    const activePickups = myRequests.filter(r => ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'COLLECTED'].includes(r.status));

    const totalWeightKg = completedPickups.reduce((acc, curr) => acc + (curr.actualWeight || curr.estimatedWeight || 0), 0);

    // Earnings simulation: ₹18 per completed kg collected + ₹50 base incentive per completed trip
    const simulatedEarnings = Math.round(completedPickups.length * 50 + totalWeightKg * 18);

    // Rating
    const ratings = getData(STORAGE_KEYS.RATINGS, []).filter(r => r.collectorId === collector.id);
    const avgRating = ratings.length > 0 
        ? (ratings.reduce((acc, curr) => acc + (curr.overallRating || 5), 0) / ratings.length).toFixed(2)
        : (collector.rating || '4.9');

    // DOM Binding
    const activeEl = document.getElementById('stat-collector-active');
    const completedEl = document.getElementById('stat-collector-completed');
    const weightEl = document.getElementById('stat-collector-weight');
    const ratingEl = document.getElementById('stat-collector-rating');
    const earningsEl = document.getElementById('stat-collector-earnings');

    if (activeEl) activeEl.textContent = activePickups.length;
    if (completedEl) completedEl.textContent = completedPickups.length;
    if (weightEl) weightEl.textContent = `${totalWeightKg.toFixed(1)} kg`;
    if (ratingEl) ratingEl.textContent = `${avgRating} ★`;
    if (earningsEl) earningsEl.textContent = `₹${simulatedEarnings.toLocaleString()}`;
}

// Assigned Requests Table (Directly assigned to this collector)
function renderCollectorAssignedRequests(collector) {
    const tbody = document.getElementById('collector-assigned-requests-tbody');
    if (!tbody) return;

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    const assigned = allRequests.filter(r => 
        r.collectorId === collector.id && 
        ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'COLLECTED'].includes(r.status)
    );

    if (assigned.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">
                    No active assignments in your queue. Check available zone requests below!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = assigned.map(r => `
        <tr>
            <td>
                <strong style="color:var(--text-main);">${r.id}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.scheduledDate} &bull; ${r.timeSlot}</div>
            </td>
            <td>
                <div style="font-weight:600;">${r.userName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${r.userPhone}</div>
            </td>
            <td>
                <div style="font-weight:600;">${r.deviceName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.category} &bull; ${r.estimatedWeight} kg</div>
            </td>
            <td>
                <div style="font-size:0.85rem;"><i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${r.address}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.area || ''} (${r.zone})</div>
            </td>
            <td>
                <span class="badge ${getStatusBadgeClass(r.status)}">
                    ${r.status.replace(/_/g, ' ')}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <a href="pickup.html?id=${r.id}" class="btn btn-sm btn-primary table-action-btn">
                        <i class="fa-solid fa-arrow-right"></i> Open Task
                    </a>
                </div>
            </td>
        </tr>
    `).join('');
}

// Available Requests in Zone (Available to claim)
function renderAvailableZoneRequests(collector) {
    const tbody = document.getElementById('collector-available-requests-tbody');
    if (!tbody) return;

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    const available = allRequests.filter(r => 
        (r.status === 'REQUESTED' || !r.collectorId) &&
        (r.zone === collector.zone || !collector.zone)
    ).slice(0, 6);

    if (available.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">
                    No unassigned requests currently available in your zone (${collector.zone}).
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = available.map(r => `
        <tr>
            <td>
                <strong style="color:var(--text-main);">${r.id}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.scheduledDate}</div>
            </td>
            <td>
                <div style="font-weight:600;">${r.deviceName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.category} &bull; ${r.estimatedWeight} kg</div>
            </td>
            <td>
                <div style="font-size:0.85rem;">${r.area || 'Metro Area'} (${r.zone})</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${r.pincode}</div>
            </td>
            <td>
                <span class="badge badge-neutral">UNASSIGNED</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="claimPickupRequest('${r.id}')">
                    <i class="fa-solid fa-check"></i> Accept Request
                </button>
            </td>
        </tr>
    `).join('');
}

// Claim / Accept a Pickup Request
function claimPickupRequest(reqId) {
    const collector = getCurrentUser();
    if (!collector) return;

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    const req = allRequests.find(r => r.id === reqId);

    if (!req) return;

    req.status = 'ACCEPTED';
    req.collectorId = collector.id;
    req.collectorName = collector.name;
    req.collectorPhone = collector.phone;
    req.collectorAvatar = collector.avatar;
    req.collectorVehicle = collector.vehicle;
    req.collectorRating = collector.rating;

    saveData(STORAGE_KEYS.REQUESTS, allRequests);

    // Notify User
    const notifications = getData(STORAGE_KEYS.NOTIFICATIONS, []);
    notifications.unshift({
        id: generateId('NOTIF'),
        userId: req.userId,
        role: 'user',
        title: 'Collector Accepted Your Pickup!',
        message: `${collector.name} has accepted request ${req.id} and is preparing for collection.`,
        type: 'tracking',
        link: `/user/tracking.html?id=${req.id}`,
        read: false,
        createdAt: new Date().toISOString()
    });
    saveData(STORAGE_KEYS.NOTIFICATIONS, notifications);

    showToast('Pickup Accepted', `Request ${req.id} added to your active queue.`, 'success');

    // Refresh views
    renderCollectorStats(collector);
    renderCollectorAssignedRequests(collector);
    renderAvailableZoneRequests(collector);
}

// In-field Active Pickup Workflow (pickup.html)
let activeCollectorPickup = null;
let collectorWorkflowMap = null;

function initCollectorPickupWorkflow() {
    const collector = requireAuth(['collector', 'admin']);
    if (!collector) return;

    const urlParams = new URLSearchParams(window.location.search);
    const reqId = urlParams.get('id');

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
    activeCollectorPickup = reqId ? allRequests.find(r => r.id === reqId) : null;

    if (!activeCollectorPickup) {
        // Find first active assigned request
        activeCollectorPickup = allRequests.find(r => 
            (r.collectorId === collector.id || collector.role === 'admin') &&
            ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'COLLECTED'].includes(r.status)
        );
    }

    if (!activeCollectorPickup) {
        renderCollectorEmptyPickup();
        return;
    }

    renderCollectorPickupUI(activeCollectorPickup);
    initCollectorMap(activeCollectorPickup, collector);
    bindPickupActionButtons(activeCollectorPickup, collector);
}

function renderCollectorPickupUI(req) {
    const idEl = document.getElementById('pickup-workflow-id');
    const badgeEl = document.getElementById('pickup-workflow-status');
    const custName = document.getElementById('pickup-cust-name');
    const custPhone = document.getElementById('pickup-cust-phone');
    const custAddress = document.getElementById('pickup-cust-address');
    const deviceEl = document.getElementById('pickup-device-info');
    const weightEl = document.getElementById('pickup-weight-info');
    const notesEl = document.getElementById('pickup-notes-info');

    if (idEl) idEl.textContent = req.id;
    if (badgeEl) {
        badgeEl.textContent = req.status.replace(/_/g, ' ');
        badgeEl.className = `badge ${getStatusBadgeClass(req.status)}`;
    }
    if (custName) custName.textContent = req.userName;
    if (custPhone) {
        custPhone.textContent = req.userPhone;
        custPhone.href = `tel:${req.userPhone}`;
    }
    if (custAddress) custAddress.textContent = `${req.address}, ${req.area || ''} (${req.pincode})`;
    if (deviceEl) deviceEl.textContent = `${req.category} — ${req.deviceName} (${req.condition})`;
    if (weightEl) weightEl.textContent = `Reported: ${req.estimatedWeight} kg`;
    if (notesEl) notesEl.textContent = req.notes || 'No special instructions provided.';

    // Populate actual weight input with estimated as default
    const actualWeightInput = document.getElementById('actual-collected-weight');
    if (actualWeightInput) {
        actualWeightInput.value = req.actualWeight || req.estimatedWeight;
    }
}

function initCollectorMap(req, collector) {
    const mapEl = document.getElementById('collector-nav-map');
    if (!mapEl || typeof L === 'undefined') return;

    const userPos = [req.lat || 12.9783, req.lng || 77.6408];
    const colPos = [collector.lat || (userPos[0] + 0.015), collector.lng || (userPos[1] - 0.015)];

    if (!collectorWorkflowMap) {
        collectorWorkflowMap = L.map('collector-nav-map').setView(colPos, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(collectorWorkflowMap);

        const colIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background:#0F766E; color:#fff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(0,0,0,0.3); border:2px solid #fff;"><i class="fa-solid fa-truck"></i></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const userIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background:#16A34A; color:#fff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(0,0,0,0.3); border:2px solid #fff;"><i class="fa-solid fa-location-dot"></i></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        L.marker(colPos, { icon: colIcon }).addTo(collectorWorkflowMap).bindPopup("<strong>Your EV Van</strong>");
        L.marker(userPos, { icon: userIcon }).addTo(collectorWorkflowMap).bindPopup(`<strong>Customer Pickup:</strong><br>${req.address}`).openPopup();

        const polyline = L.polyline([colPos, userPos], { color: '#0F766E', weight: 4, dashArray: '6, 6' }).addTo(collectorWorkflowMap);
        collectorWorkflowMap.fitBounds(polyline.getBounds().pad(0.25));
    }
}

// Bind Action buttons in Pickup Workflow
function bindPickupActionButtons(req, collector) {
    const btnOnTheWay = document.getElementById('btn-status-ontheway');
    const btnArrived = document.getElementById('btn-status-arrived');
    const btnComplete = document.getElementById('btn-status-complete');

    if (btnOnTheWay) {
        btnOnTheWay.addEventListener('click', () => {
            req.status = 'ON_THE_WAY';
            updateData(STORAGE_KEYS.REQUESTS, req.id, { status: 'ON_THE_WAY' });
            renderCollectorPickupUI(req);
            showToast('Status Updated', 'En route to customer doorstep.', 'info');
        });
    }

    if (btnArrived) {
        btnArrived.addEventListener('click', () => {
            req.status = 'ARRIVED';
            updateData(STORAGE_KEYS.REQUESTS, req.id, { status: 'ARRIVED' });
            renderCollectorPickupUI(req);
            showToast('Arrival Logged', 'Customer notified of arrival.', 'success');
        });
    }

    if (btnComplete) {
        btnComplete.addEventListener('click', () => {
            handleCompletePickup(req, collector);
        });
    }
}

// Final Completion with Recorded Weight & Photo Proof
function handleCompletePickup(req, collector) {
    const actualWeightInput = document.getElementById('actual-collected-weight');
    const actualWeight = parseFloat(actualWeightInput?.value) || req.estimatedWeight;

    req.actualWeight = actualWeight;
    req.status = 'COMPLETED';
    req.completedAt = new Date().toISOString();
    req.collectionProofUrl = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400';

    // Calculate Eco Points earned by citizen
    const pointsAwarded = Math.round(actualWeight * 10 + (CATEGORY_POINTS[req.category] || 20));
    req.ecoPointsEarned = pointsAwarded;

    // Save request
    updateData(STORAGE_KEYS.REQUESTS, req.id, req);

    // Update User Profile
    const users = getData(STORAGE_KEYS.USERS, []);
    const uIndex = users.findIndex(u => u.id === req.userId);
    if (uIndex !== -1) {
        users[uIndex].ecoPoints = (users[uIndex].ecoPoints || 0) + pointsAwarded;
        users[uIndex].totalWasteKg = parseFloat(((users[uIndex].totalWasteKg || 0) + actualWeight).toFixed(1));
        users[uIndex].pickupsCount = (users[uIndex].pickupsCount || 0) + 1;
        saveData(STORAGE_KEYS.USERS, users);
    }

    // Update Collector Stats
    const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
    const cIndex = collectors.findIndex(c => c.id === collector.id);
    if (cIndex !== -1) {
        collectors[cIndex].completedPickups = (collectors[cIndex].completedPickups || 0) + 1;
        collectors[cIndex].activeRequestsCount = Math.max(0, (collectors[cIndex].activeRequestsCount || 1) - 1);
        collectors[cIndex].totalKgCollected = parseFloat(((collectors[cIndex].totalKgCollected || 0) + actualWeight).toFixed(1));
        saveData(STORAGE_KEYS.COLLECTORS, collectors);
    }

    // Open Two-Way Rating Modal (Collector rates citizen)
    openCollectorTwoWayRatingModal(req, collector);
}

function openCollectorTwoWayRatingModal(req, collector) {
    let modal = document.getElementById('collector-rate-user-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'collector-rate-user-modal';
        modal.className = 'modal-backdrop';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title"><i class="fa-solid fa-clipboard-check" style="color:var(--primary);"></i> Pickup Completed Successfully</h3>
            </div>
            <div style="font-size:0.875rem; color:var(--text-muted); margin-bottom:1.25rem;">
                Verified actual collected weight: <strong>${req.actualWeight} kg</strong> (${req.category}).
                Citizen has been credited <strong>+${req.ecoPointsEarned} Eco Points</strong>.
            </div>

            <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem;">
                Two-Way Ecosystem: Rate Customer (${req.userName})
            </h4>

            <div style="background:#F8FAFC; padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:1rem;">
                <div class="rating-criteria-row">
                    <div>
                        <div class="rating-criteria-name">Pickup Readiness</div>
                        <div class="rating-criteria-desc">Items boxed or disconnected before arrival</div>
                    </div>
                    <select id="rate-user-readiness" class="form-control" style="width:110px;">
                        <option value="5">5 ★ Great</option>
                        <option value="4">4 ★ Good</option>
                        <option value="3">3 ★ Fair</option>
                    </select>
                </div>
                <div class="rating-criteria-row">
                    <div>
                        <div class="rating-criteria-name">Communication</div>
                        <div class="rating-criteria-desc">Clear address details & phone response</div>
                    </div>
                    <select id="rate-user-comm" class="form-control" style="width:110px;">
                        <option value="5">5 ★ Great</option>
                        <option value="4">4 ★ Good</option>
                        <option value="3">3 ★ Fair</option>
                    </select>
                </div>
                <div class="rating-criteria-row">
                    <div>
                        <div class="rating-criteria-name">Cooperation</div>
                        <div class="rating-criteria-desc">Safe handover and verification</div>
                    </div>
                    <select id="rate-user-coop" class="form-control" style="width:110px;">
                        <option value="5">5 ★ Great</option>
                        <option value="4">4 ★ Good</option>
                        <option value="3">3 ★ Fair</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Internal Agent Notes</label>
                <input type="text" id="rate-user-notes" class="form-control" placeholder="E.g. Customer was very helpful, devices packed safely." value="Smooth handover, devices verified on digital scale.">
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="submitCollectorCustomerEvaluation('${req.id}', '${req.userId}', '${collector.id}')">
                    <i class="fa-solid fa-check"></i> Submit & Return to Dashboard
                </button>
            </div>
        </div>
    `;

    openModal('collector-rate-user-modal');
}

function submitCollectorCustomerEvaluation(reqId, userId, collectorId) {
    const readiness = parseInt(document.getElementById('rate-user-readiness')?.value) || 5;
    const comm = parseInt(document.getElementById('rate-user-comm')?.value) || 5;
    const coop = parseInt(document.getElementById('rate-user-coop')?.value) || 5;
    const comment = document.getElementById('rate-user-notes')?.value || 'Smooth handover.';

    if (window.submitCollectorToUserRating) {
        submitCollectorToUserRating(reqId, userId, collectorId, {
            readiness,
            communication: comm,
            cooperation: coop,
            comment
        });
    }

    closeModal('collector-rate-user-modal');
    showToast('Pickup Finalized!', 'Points credited and inventory updated.', 'success');

    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

function renderCollectorEmptyPickup() {
    const container = document.getElementById('collector-pickup-workflow-container');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-truck-ramp-box empty-state-icon"></i>
                <h3 class="empty-state-title">No Active Pickup Selected</h3>
                <p class="empty-state-text">Select an active request from your dashboard to begin navigation and collection.</p>
                <a href="dashboard.html" class="btn btn-primary">Return to Collector Dashboard</a>
            </div>
        `;
    }
}
