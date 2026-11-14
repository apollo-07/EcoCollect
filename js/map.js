/**
 * EcoCollect - Metropolitan Map & Recycling Centers Module (map.js)
 * Manages full city map with Leaflet.js, OpenStreetMap tiles, layer filtering,
 * interactive marker popups, high-demand heat zones, and recycling centers list.
 */

let metroLeafletMap = null;
let mapMarkerLayers = {
    pickups: [],
    collectors: [],
    centers: [],
    hotspots: []
};

function initMetropolitanMapPage() {
    renderRecyclingCenterCards();
    initMetroMap();
    bindMapFilters();
}

function initMetroMap() {
    const mapEl = document.getElementById('metropolitan-city-map');
    if (!mapEl) return;

    if (typeof L === 'undefined') {
        mapEl.innerHTML = `
            <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#E2E8F0; text-align:center; padding:2rem;">
                <div>
                    <i class="fa-solid fa-map-location-dot" style="font-size:3rem; color:var(--primary); margin-bottom:1rem;"></i>
                    <h3>Metropolitan Urban Collection Grid</h3>
                    <p style="color:var(--text-muted); font-size:0.875rem;">Interactive Map displays 10 Certified Recycling Hubs, 10 EV Fleet Collectors, and 50 Citizen Collection Points.</p>
                </div>
            </div>
        `;
        return;
    }

    // Centroid of Metropolitan Area
    const cityCenter = [12.9716, 77.5946];

    if (!metroLeafletMap) {
        metroLeafletMap = L.map('metropolitan-city-map').setView(cityCenter, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(metroLeafletMap);

        populateMapMarkers();
    }
}

function populateMapMarkers() {
    if (!metroLeafletMap || typeof L === 'undefined') return;

    const requests = getData(STORAGE_KEYS.REQUESTS, []);
    const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
    const centers = getData(STORAGE_KEYS.RECYCLING_CENTERS, []);

    // 1. Certified Recycling Centers Markers (Blue)
    const centerIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:#2563EB; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid #fff;"><i class="fa-solid fa-recycle"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });

    centers.forEach(c => {
        const marker = L.marker([c.lat, c.lng], { icon: centerIcon }).addTo(metroLeafletMap);
        marker.bindPopup(`
            <div style="padding:4px; max-width:240px;">
                <span class="badge badge-info" style="font-size:0.65rem; margin-bottom:4px;">Recycling Facility</span>
                <h4 style="font-size:0.95rem; font-weight:700; margin:4px 0;">${c.name}</h4>
                <p style="font-size:0.775rem; color:#475569; margin-bottom:6px;">${c.address} (${c.zone})</p>
                <div style="font-size:0.75rem; margin-bottom:4px;"><strong>Hours:</strong> ${c.operatingHours}</div>
                <div style="font-size:0.75rem; margin-bottom:4px;"><strong>Rating:</strong> ★ ${c.rating} &bull; <strong>Capacity:</strong> ${c.dailyCapacityKg} kg/day</div>
                <div style="font-size:0.7rem; color:#16A34A;"><strong>Certifications:</strong> ${c.certifications.join(', ')}</div>
            </div>
        `);
        mapMarkerLayers.centers.push(marker);
    });

    // 2. Active Collectors Fleet Markers (Teal)
    const collectorIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:#0F766E; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid #fff;"><i class="fa-solid fa-truck"></i></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    collectors.forEach(col => {
        const marker = L.marker([col.lat, col.lng], { icon: collectorIcon }).addTo(metroLeafletMap);
        marker.bindPopup(`
            <div style="padding:4px; max-width:220px;">
                <span class="badge ${col.status === 'AVAILABLE' ? 'badge-success' : 'badge-warning'}" style="font-size:0.65rem;">${col.status}</span>
                <h4 style="font-size:0.95rem; font-weight:700; margin:4px 0;">${col.name}</h4>
                <p style="font-size:0.775rem; color:#475569; margin-bottom:4px;">${col.vehicle}</p>
                <div style="font-size:0.75rem;"><strong>Rating:</strong> ★ ${col.rating} (${col.completedPickups} completed)</div>
                <div style="font-size:0.75rem;"><strong>Zone:</strong> ${col.zone}</div>
            </div>
        `);
        mapMarkerLayers.collectors.push(marker);
    });

    // 3. User Pickup Locations (Green)
    const pickupIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:#16A34A; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.25); border:1.5px solid #fff; font-size:0.7rem;"><i class="fa-solid fa-box"></i></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
    });

    requests.slice(0, 30).forEach(req => {
        const marker = L.marker([req.lat, req.lng], { icon: pickupIcon }).addTo(metroLeafletMap);
        marker.bindPopup(`
            <div style="padding:4px; max-width:220px;">
                <span class="badge ${getStatusBadgeClass(req.status)}" style="font-size:0.65rem;">${req.status.replace(/_/g, ' ')}</span>
                <h4 style="font-size:0.9rem; font-weight:700; margin:4px 0;">${req.deviceName}</h4>
                <div style="font-size:0.75rem;"><strong>Location:</strong> ${req.area || 'Metro Area'} (${req.zone})</div>
                <div style="font-size:0.75rem;"><strong>Category:</strong> ${req.category} (${req.actualWeight || req.estimatedWeight} kg)</div>
                <div style="font-size:0.75rem;"><strong>Nearest Collector:</strong> ${req.collectorName || 'Rajesh Kumar'}</div>
            </div>
        `);
        mapMarkerLayers.pickups.push(marker);
    });

    // 4. High-Demand Areas (Semi-transparent Circle Hotspots)
    const hotspots = [
        { name: 'Koramangala & HSR Tech Belt', lat: 12.9250, lng: 77.6300, radius: 2200, count: 18, kg: 380, nearestCol: 'Rajesh Kumar' },
        { name: 'Indiranagar & CBD Corridor', lat: 12.9750, lng: 77.6250, radius: 2000, count: 15, kg: 290, nearestCol: 'Suresh Babu' },
        { name: 'Whitefield IT Cluster', lat: 12.9700, lng: 77.7400, radius: 2800, count: 22, kg: 510, nearestCol: 'Sunil Chhetri' }
    ];

    hotspots.forEach(h => {
        const circle = L.circle([h.lat, h.lng], {
            color: '#F59E0B',
            fillColor: '#F59E0B',
            fillOpacity: 0.18,
            radius: h.radius
        }).addTo(metroLeafletMap);

        circle.bindPopup(`
            <div style="padding:4px; max-width:230px;">
                <span class="badge badge-warning" style="font-size:0.65rem;">High-Demand Hotspot</span>
                <h4 style="font-size:0.95rem; font-weight:700; margin:4px 0;">${h.name}</h4>
                <div style="font-size:0.75rem; margin-bottom:2px;"><strong>Pickups Logged:</strong> ${h.count} requests</div>
                <div style="font-size:0.75rem; margin-bottom:2px;"><strong>E-Waste Collected:</strong> ${h.kg} kg</div>
                <div style="font-size:0.75rem;"><strong>Primary Agent:</strong> ${h.nearestCol}</div>
            </div>
        `);
        mapMarkerLayers.hotspots.push(circle);
    });
}

// Bind Map Layer & Zone Filter Checkboxes
function bindMapFilters() {
    const layerCenters = document.getElementById('layer-toggle-centers');
    const layerCollectors = document.getElementById('layer-toggle-collectors');
    const layerPickups = document.getElementById('layer-toggle-pickups');
    const layerHotspots = document.getElementById('layer-toggle-hotspots');
    const zoneFilter = document.getElementById('map-zone-filter');

    function toggleLayer(layerKey, isVisible) {
        if (!metroLeafletMap) return;
        mapMarkerLayers[layerKey].forEach(m => {
            if (isVisible) {
                if (!metroLeafletMap.hasLayer(m)) metroLeafletMap.addLayer(m);
            } else {
                if (metroLeafletMap.hasLayer(m)) metroLeafletMap.removeLayer(m);
            }
        });
    }

    if (layerCenters) layerCenters.addEventListener('change', (e) => toggleLayer('centers', e.target.checked));
    if (layerCollectors) layerCollectors.addEventListener('change', (e) => toggleLayer('collectors', e.target.checked));
    if (layerPickups) layerPickups.addEventListener('change', (e) => toggleLayer('pickups', e.target.checked));
    if (layerHotspots) layerHotspots.addEventListener('change', (e) => toggleLayer('hotspots', e.target.checked));

    if (zoneFilter) {
        zoneFilter.addEventListener('change', (e) => {
            const zone = e.target.value;
            const zoneCoords = {
                'ALL': [12.9716, 77.5946, 12],
                'Central Zone': [12.9716, 77.5946, 14],
                'South Zone': [12.9250, 77.6200, 13],
                'East Zone': [12.9780, 77.6900, 13],
                'West Zone': [13.0030, 77.5500, 13],
                'North Zone': [13.0400, 77.5900, 13]
            };
            if (zoneCoords[zone] && metroLeafletMap) {
                const [lat, lng, zoom] = zoneCoords[zone];
                metroLeafletMap.flyTo([lat, lng], zoom);
            }
        });
    }
}

// Pan Map to Specific Center
function focusRecyclingCenter(centerId) {
    const centers = getData(STORAGE_KEYS.RECYCLING_CENTERS, []);
    const c = centers.find(item => item.id === centerId);
    if (!c || !metroLeafletMap) return;

    metroLeafletMap.flyTo([c.lat, c.lng], 15);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Map Centered', `Navigated to ${c.name}`, 'info');
}

// Render Recycling Centers Directory Cards
function renderRecyclingCenterCards() {
    const container = document.getElementById('recycling-centers-grid');
    if (!container) return;

    const centers = getData(STORAGE_KEYS.RECYCLING_CENTERS, []);

    container.innerHTML = centers.map(c => `
        <div class="stat-card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
                    <span class="badge badge-info">${c.zone}</span>
                    <span class="badge badge-success"><i class="fa-solid fa-star"></i> ${c.rating}</span>
                </div>

                <h3 style="font-size:1.15rem; font-weight:700; color:var(--text-main); margin-bottom:0.35rem;">${c.name}</h3>
                <p style="font-size:0.825rem; color:var(--text-muted); margin-bottom:0.75rem;">
                    <i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${c.address}
                </p>

                <div style="background:var(--bg-surface-alt); padding:0.75rem; border-radius:var(--radius-md); font-size:0.775rem; margin-bottom:1rem;">
                    <div><strong>Operating Hours:</strong> ${c.operatingHours}</div>
                    <div style="margin-top:2px;"><strong>Contact:</strong> ${c.contact}</div>
                    <div style="margin-top:2px;"><strong>Daily Capacity:</strong> ${c.dailyCapacityKg} kg/day</div>
                </div>

                <div style="font-size:0.75rem; margin-bottom:1rem;">
                    <strong style="color:var(--text-muted); text-transform:uppercase; font-size:0.7rem; display:block; margin-bottom:4px;">Accepted Categories:</strong>
                    <div style="display:flex; flex-wrap:wrap; gap:4px;">
                        ${c.acceptedCategories.slice(0, 5).map(cat => `<span class="badge badge-neutral" style="font-size:0.68rem;">${cat}</span>`).join('')}
                        ${c.acceptedCategories.length > 5 ? `<span class="badge badge-neutral" style="font-size:0.68rem;">+${c.acceptedCategories.length - 5} more</span>` : ''}
                    </div>
                </div>
            </div>

            <div style="border-top:1px solid var(--border-color); padding-top:0.85rem; display:flex; align-items:center; justify-content:space-between;">
                <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-certificate" style="color:#0F766E;"></i> ${c.certifications[0]}</span>
                <button class="btn btn-sm btn-outline-primary" onclick="focusRecyclingCenter('${c.id}')">
                    <i class="fa-solid fa-map-location-dot"></i> View on Map
                </button>
            </div>
        </div>
    `).join('');
}
