/**
 * EcoCollect - Live Pickup Tracking & Vehicle Movement Simulation (tracking.js)
 * Manages live timeline progress, Leaflet route rendering, animated moving collector marker,
 * and status transitions.
 */

const TRACKING_STAGES = [
    { key: 'REQUESTED', label: 'Requested', icon: 'fa-file-circle-plus' },
    { key: 'ASSIGNED', label: 'Assigned', icon: 'fa-user-check' },
    { key: 'ACCEPTED', label: 'Accepted', icon: 'fa-circle-check' },
    { key: 'ON_THE_WAY', label: 'On The Way', icon: 'fa-truck-fast' },
    { key: 'ARRIVED', label: 'Arrived', icon: 'fa-location-dot' },
    { key: 'COLLECTED', label: 'Collected', icon: 'fa-box-check' },
    { key: 'COMPLETED', label: 'Completed', icon: 'fa-trophy' }
];

let activeTrackingRequest = null;
let trackingMap = null;
let collectorMarker = null;
let userMarker = null;
let centerMarker = null;
let routePolyline = null;
let movementAnimationTimer = null;

function initTrackingPage() {
    const user = requireAuth(['user', 'admin']);
    if (!user) return;

    // Get Request ID from URL or find most recent active
    const urlParams = new URLSearchParams(window.location.search);
    let reqId = urlParams.get('id');

    const allRequests = getData(STORAGE_KEYS.REQUESTS, []);

    if (reqId) {
        activeTrackingRequest = allRequests.find(r => r.id === reqId);
    }

    if (!activeTrackingRequest) {
        // Find user's active or recent request
        activeTrackingRequest = allRequests.find(r => 
            (r.userId === user.id || user.role === 'admin') && 
            ['ON_THE_WAY', 'ARRIVED', 'ASSIGNED', 'ACCEPTED', 'REQUESTED'].includes(r.status)
        ) || allRequests[0];
    }

    if (!activeTrackingRequest) {
        renderTrackingEmptyState();
        return;
    }

    renderTrackingDetails(activeTrackingRequest);
    initTrackingMap(activeTrackingRequest);
    bindSimulatorControls(activeTrackingRequest);
}

// Render Request Details & Timeline
function renderTrackingDetails(req) {
    // Basic elements
    const reqIdEl = document.getElementById('tracking-request-id');
    const statusBadge = document.getElementById('tracking-status-badge');
    const deviceNameEl = document.getElementById('tracking-device-name');
    const categoryEl = document.getElementById('tracking-category');
    const addressEl = document.getElementById('tracking-address');
    const timeSlotEl = document.getElementById('tracking-timeslot');
    const dateEl = document.getElementById('tracking-date');

    if (reqIdEl) reqIdEl.textContent = req.id;
    if (deviceNameEl) deviceNameEl.textContent = req.deviceName;
    if (categoryEl) categoryEl.textContent = `${req.category} (${req.estimatedWeight} kg)`;
    if (addressEl) addressEl.textContent = `${req.address}, ${req.area || ''} (${req.zone})`;
    if (timeSlotEl) timeSlotEl.textContent = req.timeSlot;
    if (dateEl) dateEl.textContent = req.scheduledDate;

    if (statusBadge) {
        statusBadge.textContent = req.status.replace(/_/g, ' ');
        statusBadge.className = `badge ${getStatusBadgeClass(req.status)}`;
    }

    // Render Timeline
    const timelineContainer = document.getElementById('tracking-timeline');
    if (timelineContainer) {
        const currentIdx = TRACKING_STAGES.findIndex(s => s.key === req.status);
        const effectiveIdx = currentIdx === -1 ? (req.status === 'CANCELLED' ? -1 : 0) : currentIdx;

        timelineContainer.innerHTML = TRACKING_STAGES.map((stage, idx) => {
            let stateClass = '';
            if (idx < effectiveIdx) stateClass = 'completed';
            else if (idx === effectiveIdx) stateClass = 'active';

            return `
                <div class="tracking-stage-step ${stateClass}">
                    <div class="stage-dot">
                        <i class="fa-solid ${stage.icon}"></i>
                    </div>
                    <div class="stage-title">${stage.label}</div>
                </div>
            `;
        }).join('');
    }

    // Collector Card
    const collectorCard = document.getElementById('tracking-collector-info');
    if (collectorCard) {
        if (req.collectorName) {
            collectorCard.innerHTML = `
                <div class="collector-profile-banner">
                    <img src="${req.collectorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" class="collector-banner-avatar" alt="Collector">
                    <div class="collector-banner-details">
                        <div class="collector-name-row">
                            <h3>${req.collectorName}</h3>
                            <span class="badge badge-success"><i class="fa-solid fa-star"></i> ${req.collectorRating || 4.8}</span>
                        </div>
                        <p class="collector-vehicle-info"><i class="fa-solid fa-truck-pickup"></i> ${req.collectorVehicle || 'Certified EV Collection Vehicle'}</p>
                        <p class="collector-contact-info"><i class="fa-solid fa-phone"></i> ${req.collectorPhone || '+91 98450 11223'}</p>
                    </div>
                    <div class="collector-actions">
                        <a href="tel:${req.collectorPhone || '+919845011223'}" class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-phone"></i> Call</a>
                    </div>
                </div>
            `;
        } else {
            collectorCard.innerHTML = `
                <div style="padding:1rem; background:#F8FAFC; border-radius:var(--radius-md); text-align:center; color:var(--text-muted);">
                    <i class="fa-solid fa-hourglass-half" style="font-size:1.5rem; margin-bottom:0.5rem; color:var(--warning);"></i>
                    <p><strong>Matching with Regional Collector...</strong></p>
                    <p style="font-size:0.8rem;">Our smart dispatch algorithm is scanning available collectors in ${req.zone}.</p>
                </div>
            `;
        }
    }

    // Action buttons based on status
    const actionContainer = document.getElementById('tracking-user-actions');
    if (actionContainer) {
        if (req.status === 'COMPLETED') {
            actionContainer.innerHTML = `
                <div style="background:#ECFDF5; border:1px solid #6EE7B7; border-radius:var(--radius-md); padding:1rem; text-align:center; width:100%;">
                    <strong style="color:#065F46; font-size:1rem;"><i class="fa-solid fa-circle-check"></i> Pickup Completed!</strong>
                    <p style="color:#047857; font-size:0.85rem; margin:0.35rem 0 0.85rem;">You earned ${req.ecoPointsEarned || req.potentialPoints} Eco Points. Please rate your experience.</p>
                    <a href="rating.html?id=${req.id}" class="btn btn-primary btn-sm"><i class="fa-solid fa-star"></i> Rate Collection Service</a>
                </div>
            `;
        } else if (['REQUESTED', 'ASSIGNED'].includes(req.status)) {
            actionContainer.innerHTML = `
                <button class="btn btn-outline btn-sm btn-danger" onclick="cancelActiveRequest('${req.id}')">
                    <i class="fa-solid fa-ban"></i> Cancel Request
                </button>
            `;
        } else {
            actionContainer.innerHTML = `
                <span style="font-size:0.825rem; color:var(--text-muted);"><i class="fa-solid fa-shield-halved"></i> Verified Doorstep Collection in Progress</span>
            `;
        }
    }
}

// Badge styling helper
function getStatusBadgeClass(status) {
    switch (status) {
        case 'REQUESTED': return 'badge-neutral';
        case 'ASSIGNED': return 'badge-info';
        case 'ACCEPTED': return 'badge-info';
        case 'ON_THE_WAY': return 'badge-warning';
        case 'ARRIVED': return 'badge-primary';
        case 'COLLECTED': return 'badge-secondary';
        case 'COMPLETED': return 'badge-success';
        case 'CANCELLED': return 'badge-danger';
        default: return 'badge-neutral';
    }
}

// Leaflet Map with Animated Simulation
function initTrackingMap(req) {
    const mapEl = document.getElementById('tracking-live-map');
    if (!mapEl) return;

    if (typeof L === 'undefined') {
        mapEl.innerHTML = `
            <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#E2E8F0; text-align:center; padding:1.5rem;">
                <div>
                    <i class="fa-solid fa-map-location-dot" style="font-size:2.5rem; color:var(--primary); margin-bottom:0.75rem;"></i>
                    <h4>Simulated Live Metropolitan Route</h4>
                    <p style="font-size:0.85rem; color:var(--text-muted);">User: ${req.lat.toFixed(4)}, ${req.lng.toFixed(4)} &bull; Zone: ${req.zone}</p>
                </div>
            </div>
        `;
        return;
    }

    // Default coordinates
    const userPos = [req.lat || 12.9783, req.lng || 77.6408];
    // Collector starts ~1.5km offset
    const collectorStartPos = [userPos[0] + 0.015, userPos[1] - 0.018];
    // Recycling center coordinate
    const centerPos = [userPos[0] + 0.035, userPos[1] + 0.025];

    if (!trackingMap) {
        trackingMap = L.map('tracking-live-map').setView(userPos, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(trackingMap);

        // Custom Markers
        const userIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background:#16A34A; color:#fff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(0,0,0,0.3); border:2px solid #fff;"><i class="fa-solid fa-house"></i></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const vanIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background:#0F766E; color:#fff; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(0,0,0,0.35); border:2px solid #fff; animation: pulse 2s infinite;"><i class="fa-solid fa-truck-fast"></i></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const plantIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background:#2563EB; color:#fff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(0,0,0,0.3); border:2px solid #fff;"><i class="fa-solid fa-recycle"></i></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        userMarker = L.marker(userPos, { icon: userIcon }).addTo(trackingMap);
        userMarker.bindPopup(`<strong>Your Doorstep Location</strong><br>${req.address}`);

        centerMarker = L.marker(centerPos, { icon: plantIcon }).addTo(trackingMap);
        centerMarker.bindPopup(`<strong>Metropolitan E-Waste Recovery Hub</strong><br>ISO & R2 Certified Processing Center`);

        collectorMarker = L.marker(collectorStartPos, { icon: vanIcon }).addTo(trackingMap);
        collectorMarker.bindPopup(`<strong>Collector: ${req.collectorName || 'EcoCollect Agent'}</strong><br>Status: ${req.status.replace(/_/g, ' ')}`).openPopup();

        // Draw connecting route
        const waypoints = [
            collectorStartPos,
            [collectorStartPos[0] - 0.005, collectorStartPos[1] + 0.008],
            userPos,
            [userPos[0] + 0.015, userPos[1] + 0.012],
            centerPos
        ];

        routePolyline = L.polyline(waypoints, {
            color: '#16A34A',
            weight: 4,
            opacity: 0.7,
            dashArray: '8, 8'
        }).addTo(trackingMap);

        trackingMap.fitBounds(routePolyline.getBounds().pad(0.2));
    }
}

// Bind Demo Simulation Controls
function bindSimulatorControls(req) {
    const advanceBtn = document.getElementById('btn-advance-status');
    const simulateDriveBtn = document.getElementById('btn-simulate-drive');

    if (advanceBtn) {
        advanceBtn.addEventListener('click', () => {
            advanceRequestStage(req);
        });
    }

    if (simulateDriveBtn) {
        simulateDriveBtn.addEventListener('click', () => {
            startCollectorDriveAnimation(req);
        });
    }
}

// Advance Request to Next Status Stage
function advanceRequestStage(req) {
    const currentIdx = TRACKING_STAGES.findIndex(s => s.key === req.status);
    if (currentIdx < TRACKING_STAGES.length - 1) {
        const nextStage = TRACKING_STAGES[currentIdx + 1].key;
        req.status = nextStage;

        // If completed, record actual weight and points
        if (nextStage === 'COMPLETED') {
            req.actualWeight = req.estimatedWeight;
            req.completedAt = new Date().toISOString();
            req.ecoPointsEarned = req.potentialPoints || 50;

            // Credit points to user
            const users = getData(STORAGE_KEYS.USERS, []);
            const uIndex = users.findIndex(u => u.id === req.userId);
            if (uIndex !== -1) {
                users[uIndex].ecoPoints = (users[uIndex].ecoPoints || 0) + req.ecoPointsEarned;
                users[uIndex].totalWasteKg = parseFloat(((users[uIndex].totalWasteKg || 0) + req.actualWeight).toFixed(1));
                users[uIndex].pickupsCount = (users[uIndex].pickupsCount || 0) + 1;
                saveData(STORAGE_KEYS.USERS, users);
            }
        }

        updateData(STORAGE_KEYS.REQUESTS, req.id, req);
        renderTrackingDetails(req);
        showToast('Status Updated', `Request transitioned to ${nextStage.replace(/_/g, ' ')}`, 'info');

        // Move marker closer if arrived
        if (nextStage === 'ARRIVED' && collectorMarker && userMarker) {
            collectorMarker.setLatLng(userMarker.getLatLng());
            collectorMarker.bindPopup(`<strong>Collector Has Arrived at Doorstep!</strong>`).openPopup();
        }
    } else {
        showToast('Lifecycle Complete', 'This pickup request is already COMPLETED.', 'info');
    }
}

// Simulate animated driving movement along the route
function startCollectorDriveAnimation(req) {
    if (!collectorMarker || !userMarker) {
        showToast('Simulation Notice', 'Map markers not initialized.', 'warning');
        return;
    }

    showToast('Simulation Started', 'Collector van is driving toward pickup location...', 'success');

    const start = collectorMarker.getLatLng();
    const end = userMarker.getLatLng();

    let step = 0;
    const totalSteps = 40;

    if (movementAnimationTimer) clearInterval(movementAnimationTimer);

    movementAnimationTimer = setInterval(() => {
        step++;
        const currentLat = start.lat + (end.lat - start.lat) * (step / totalSteps);
        const currentLng = start.lng + (end.lng - start.lng) * (step / totalSteps);

        collectorMarker.setLatLng([currentLat, currentLng]);

        if (step >= totalSteps) {
            clearInterval(movementAnimationTimer);
            showToast('Van Arrived!', 'Collector has reached your doorstep.', 'success');
            if (req.status === 'ON_THE_WAY' || req.status === 'ASSIGNED' || req.status === 'ACCEPTED') {
                req.status = 'ARRIVED';
                updateData(STORAGE_KEYS.REQUESTS, req.id, req);
                renderTrackingDetails(req);
            }
        }
    }, 100);
}

// Cancel Request
function cancelActiveRequest(reqId) {
    if (confirm("Are you sure you want to cancel this pending pickup request?")) {
        const req = updateData(STORAGE_KEYS.REQUESTS, reqId, { status: 'CANCELLED' });
        if (req) {
            showToast('Request Cancelled', 'Your pickup request has been cancelled.', 'info');
            renderTrackingDetails(req);
        }
    }
}

function renderTrackingEmptyState() {
    const mainContainer = document.querySelector('.tracking-page-container');
    if (mainContainer) {
        mainContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-truck-ramp-box empty-state-icon"></i>
                <h3 class="empty-state-title">No Active Pickups Found</h3>
                <p class="empty-state-text">You don't have any ongoing e-waste collection requests to track right now.</p>
                <a href="request.html" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Schedule New Pickup</a>
            </div>
        `;
    }
}
