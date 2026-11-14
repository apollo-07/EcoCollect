/**
 * EcoCollect - E-Waste Pickup Request Wizard & Smart Assignment Algorithm (request.js)
 * Manages 4-step wizard, interactive Leaflet location picker, validation,
 * and multi-factor dynamic collector assignment scoring.
 */

// Form state holder
const requestFormState = {
    step: 1,
    category: 'Mobile Phone',
    deviceName: '',
    quantity: 1,
    estimatedWeight: 0.5,
    condition: 'Working',
    imageDataUrl: null,
    address: '',
    city: 'Metro City',
    area: '',
    zone: 'East Zone',
    pincode: '',
    lat: 12.9783,
    lng: 77.6408,
    date: '',
    timeSlot: '09:00 AM – 12:00 PM',
    notes: ''
};

// Map instance
let pickupLocationMap = null;
let pickupMarker = null;

// Initialize Request Wizard Page
function initRequestWizard() {
    const user = requireAuth(['user']);
    if (!user) return;

    // Pre-populate user defaults
    requestFormState.address = user.address || '';
    requestFormState.area = user.area || 'Indiranagar';
    requestFormState.zone = user.zone || 'East Zone';
    requestFormState.pincode = user.pincode || '560038';
    requestFormState.lat = user.lat || 12.9783;
    requestFormState.lng = user.lng || 77.6408;

    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('pickup-date');
    if (dateInput) {
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        dateInput.min = tomorrowStr;
        dateInput.value = tomorrowStr;
        requestFormState.date = tomorrowStr;
    }

    bindStepNavigation();
    bindConditionPickers();
    bindTimeSlotPickers();
    bindImageUploader();
    bindCategoryAutoEstimator();
    bindStep1Fields();
    bindStep2Fields();
    updateWizardUI();
}

// Bind Wizard Stepping
function bindStepNavigation() {
    document.querySelectorAll('.btn-wizard-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateCurrentStep(requestFormState.step)) {
                requestFormState.step++;
                updateWizardUI();
            }
        });
    });

    document.querySelectorAll('.btn-wizard-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            if (requestFormState.step > 1) {
                requestFormState.step--;
                updateWizardUI();
            }
        });
    });

    const confirmBtn = document.getElementById('btn-confirm-pickup');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleRequestConfirmation);
    }
}

// Update UI on step transition
function updateWizardUI() {
    const step = requestFormState.step;

    // Progress line & circles
    const progressBar = document.getElementById('wizard-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${((step - 1) / 3) * 100}%`;
    }

    document.querySelectorAll('.wizard-step').forEach((el, idx) => {
        const stepNum = idx + 1;
        el.classList.remove('active', 'completed');
        if (stepNum === step) {
            el.classList.add('active');
        } else if (stepNum < step) {
            el.classList.add('completed');
        }
    });

    // Step panes
    document.querySelectorAll('.wizard-step-pane').forEach((pane, idx) => {
        if (idx + 1 === step) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    // Step-specific initializers
    if (step === 2) {
        initOrUpdateLocationMap();
    } else if (step === 4) {
        renderReviewSummary();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Step 1: Input binding & validation
function bindStep1Fields() {
    const categorySelect = document.getElementById('ewaste-category');
    const deviceNameInput = document.getElementById('device-name');
    const quantityInput = document.getElementById('device-quantity');
    const weightInput = document.getElementById('estimated-weight');

    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            requestFormState.category = e.target.value;
            autoSuggestWeight();
        });
    }

    if (deviceNameInput) {
        deviceNameInput.addEventListener('input', (e) => {
            requestFormState.deviceName = e.target.value.trim();
        });
    }

    if (quantityInput) {
        quantityInput.addEventListener('input', (e) => {
            requestFormState.quantity = parseInt(e.target.value) || 1;
            autoSuggestWeight();
        });
    }

    if (weightInput) {
        weightInput.addEventListener('input', (e) => {
            requestFormState.estimatedWeight = parseFloat(e.target.value) || 0.5;
        });
    }
}

// Bind Condition Radio Pills
function bindConditionPickers() {
    document.querySelectorAll('.condition-option').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.condition-option').forEach(opt => opt.classList.remove('selected'));
            el.classList.add('selected');
            requestFormState.condition = el.getAttribute('data-condition');
        });
    });
}

// Bind Time Slot Pills
function bindTimeSlotPickers() {
    document.querySelectorAll('.time-slot-pill').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.time-slot-pill').forEach(p => p.classList.remove('selected'));
            el.classList.add('selected');
            requestFormState.timeSlot = el.getAttribute('data-slot');
        });
    });

    const dateInput = document.getElementById('pickup-date');
    if (dateInput) {
        dateInput.addEventListener('change', (e) => {
            requestFormState.date = e.target.value;
        });
    }

    const notesInput = document.getElementById('pickup-notes');
    if (notesInput) {
        notesInput.addEventListener('input', (e) => {
            requestFormState.notes = e.target.value.trim();
        });
    }
}

// Auto estimate approximate weight per item
function autoSuggestWeight() {
    const weights = {
        'Mobile Phone': 0.35,
        'Laptop': 2.2,
        'Desktop': 9.0,
        'Monitor': 4.5,
        'Television': 12.0,
        'Refrigerator': 45.0,
        'Washing Machine': 35.0,
        'Printer': 6.5,
        'Keyboard': 0.6,
        'Mouse': 0.15,
        'Battery': 3.0,
        'Charger': 0.25,
        'Other': 1.5
    };
    const base = weights[requestFormState.category] || 1.0;
    const est = (base * requestFormState.quantity).toFixed(1);
    requestFormState.estimatedWeight = parseFloat(est);
    const weightInput = document.getElementById('estimated-weight');
    if (weightInput) weightInput.value = est;
}

function bindCategoryAutoEstimator() {
    autoSuggestWeight();
}

// Image Dropzone & AI Classification binding
function bindImageUploader() {
    const dropzone = document.getElementById('device-image-dropzone');
    const fileInput = document.getElementById('device-image-input');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview-img');
    const removeBtn = document.getElementById('image-preview-remove');
    const aiCard = document.getElementById('ai-classifier-card');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            requestFormState.imageDataUrl = event.target.result;
            if (previewImg) previewImg.src = event.target.result;
            if (previewContainer) previewContainer.style.display = 'block';

            // Trigger AI Classifier Simulation
            if (aiCard && window.AIClassifierService) {
                aiCard.innerHTML = `
                    <div class="ai-scanning-indicator">
                        <div class="ai-spinner"></div>
                        <span>EcoCollect VisionNet: Analyzing circuitry, housing, and battery hazards...</span>
                    </div>
                `;
                aiCard.style.display = 'block';

                try {
                    const result = await AIClassifierService.classifyImage(file, file.name);
                    AIClassifierService.renderResults(aiCard, result, (appliedData) => {
                        // Callback on auto-fill
                        const catSelect = document.getElementById('ewaste-category');
                        if (catSelect) {
                            catSelect.value = appliedData.category;
                            requestFormState.category = appliedData.category;
                        }

                        const nameInput = document.getElementById('device-name');
                        if (nameInput) {
                            nameInput.value = appliedData.detectedObject;
                            requestFormState.deviceName = appliedData.detectedObject;
                        }

                        // Set condition
                        document.querySelectorAll('.condition-option').forEach(opt => {
                            if (opt.getAttribute('data-condition') === appliedData.condition) {
                                opt.click();
                            }
                        });

                        const weightInput = document.getElementById('estimated-weight');
                        if (weightInput) {
                            weightInput.value = appliedData.estimatedWeightKg;
                            requestFormState.estimatedWeight = appliedData.estimatedWeightKg;
                        }
                    });
                } catch (err) {
                    console.error('AI classification error:', err);
                    aiCard.style.display = 'none';
                }
            }
        };
        reader.readAsDataURL(file);
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.value = '';
            requestFormState.imageDataUrl = null;
            if (previewContainer) previewContainer.style.display = 'none';
            if (aiCard) aiCard.style.display = 'none';
        });
    }
}

// Step 2: Location inputs and Leaflet Map
function bindStep2Fields() {
    const addressInput = document.getElementById('pickup-address');
    const areaInput = document.getElementById('pickup-area');
    const zoneSelect = document.getElementById('pickup-zone');
    const pincodeInput = document.getElementById('pickup-pincode');
    const gpsBtn = document.getElementById('btn-get-gps');

    if (addressInput) {
        addressInput.value = requestFormState.address;
        addressInput.addEventListener('input', (e) => requestFormState.address = e.target.value.trim());
    }

    if (areaInput) {
        areaInput.value = requestFormState.area;
        areaInput.addEventListener('input', (e) => requestFormState.area = e.target.value.trim());
    }

    if (zoneSelect) {
        zoneSelect.value = requestFormState.zone;
        zoneSelect.addEventListener('change', (e) => {
            requestFormState.zone = e.target.value;
            // Update marker center to zone centroid roughly
            const zoneCoords = {
                'Central Zone': [12.9716, 77.5946],
                'South Zone': [12.9250, 77.6200],
                'East Zone': [12.9780, 77.6900],
                'West Zone': [13.0030, 77.5500],
                'North Zone': [13.0400, 77.5900]
            };
            if (zoneCoords[e.target.value] && pickupLocationMap) {
                const [lat, lng] = zoneCoords[e.target.value];
                requestFormState.lat = lat;
                requestFormState.lng = lng;
                pickupLocationMap.setView([lat, lng], 13);
                if (pickupMarker) pickupMarker.setLatLng([lat, lng]);
            }
        });
    }

    if (pincodeInput) {
        pincodeInput.value = requestFormState.pincode;
        pincodeInput.addEventListener('input', (e) => requestFormState.pincode = e.target.value.trim());
    }

    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                showToast('Acquiring Location', 'Detecting your GPS coordinates...', 'info');
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        requestFormState.lat = pos.coords.latitude;
                        requestFormState.lng = pos.coords.longitude;
                        if (pickupLocationMap) {
                            pickupLocationMap.setView([requestFormState.lat, requestFormState.lng], 15);
                            if (pickupMarker) pickupMarker.setLatLng([requestFormState.lat, requestFormState.lng]);
                        }
                        showToast('Location Updated', 'Map marker moved to your current location.', 'success');
                    },
                    (err) => {
                        // Fallback simulated GPS
                        showToast('GPS Simulated', 'Used simulated metropolitan residential coordinates.', 'info');
                    }
                );
            }
        });
    }
}

// Initialize Leaflet Map for Step 2
function initOrUpdateLocationMap() {
    const mapEl = document.getElementById('pickup-map');
    if (!mapEl) return;

    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        mapEl.innerHTML = `
            <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#E2E8F0; color:#475569; text-align:center; padding:1rem;">
                <div>
                    <i class="fa-solid fa-map-location-dot" style="font-size:2rem; margin-bottom:0.5rem; color:var(--primary);"></i>
                    <p><strong>Interactive Metropolitan Location Picker</strong></p>
                    <p style="font-size:0.8rem;">Lat: ${requestFormState.lat.toFixed(4)}, Lng: ${requestFormState.lng.toFixed(4)} (${requestFormState.zone})</p>
                </div>
            </div>
        `;
        return;
    }

    if (!pickupLocationMap) {
        pickupLocationMap = L.map('pickup-map').setView([requestFormState.lat, requestFormState.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(pickupLocationMap);

        const greenIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background:#16A34A; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid #fff;"><i class="fa-solid fa-house"></i></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });

        pickupMarker = L.marker([requestFormState.lat, requestFormState.lng], {
            draggable: true,
            icon: greenIcon
        }).addTo(pickupLocationMap);

        pickupMarker.bindPopup("<strong>Pickup Location</strong><br>Drag marker or click map to reposition.").openPopup();

        pickupMarker.on('dragend', (e) => {
            const coord = e.target.getLatLng();
            requestFormState.lat = coord.lat;
            requestFormState.lng = coord.lng;
            showToast('Pin Moved', `Coords: ${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`, 'info');
        });

        pickupLocationMap.on('click', (e) => {
            requestFormState.lat = e.latlng.lat;
            requestFormState.lng = e.latlng.lng;
            pickupMarker.setLatLng(e.latlng);
            pickupMarker.openPopup();
        });
    } else {
        setTimeout(() => {
            pickupLocationMap.invalidateSize();
            pickupLocationMap.setView([requestFormState.lat, requestFormState.lng], 13);
        }, 150);
    }
}

// Step Validation
function validateCurrentStep(step) {
    if (step === 1) {
        const deviceNameInput = document.getElementById('device-name');
        if (!requestFormState.deviceName) {
            showToast('Missing Field', 'Please enter a device name (e.g. Dell Inspiron 15)', 'error');
            if (deviceNameInput) deviceNameInput.focus();
            return false;
        }
        if (!requestFormState.estimatedWeight || requestFormState.estimatedWeight <= 0) {
            showToast('Invalid Weight', 'Please provide an estimated weight in kg.', 'error');
            return false;
        }
        return true;
    }

    if (step === 2) {
        if (!requestFormState.address) {
            showToast('Missing Address', 'Please provide a street or apartment address.', 'error');
            return false;
        }
        if (!requestFormState.pincode) {
            showToast('Missing Pincode', 'Please enter a 6-digit postal pincode.', 'error');
            return false;
        }
        return true;
    }

    if (step === 3) {
        if (!requestFormState.date) {
            showToast('Missing Date', 'Please select a preferred pickup date.', 'error');
            return false;
        }
        return true;
    }

    return true;
}

// Step 4: Render Review Summary
function renderReviewSummary() {
    const summaryCard = document.getElementById('review-summary-details');
    if (!summaryCard) return;

    const pointsPreview = Math.round(
        requestFormState.estimatedWeight * 10 + (CATEGORY_POINTS[requestFormState.category] || 20)
    );

    summaryCard.innerHTML = `
        <div class="review-section">
            <div class="review-section-title"><i class="fa-solid fa-box-archive"></i> E-Waste Details</div>
            <div class="review-row">
                <span class="review-label">Category:</span>
                <span class="review-value">${requestFormState.category}</span>
            </div>
            <div class="review-row">
                <span class="review-label">Device Name:</span>
                <span class="review-value">${requestFormState.deviceName}</span>
            </div>
            <div class="review-row">
                <span class="review-label">Quantity & Est. Weight:</span>
                <span class="review-value">${requestFormState.quantity} item(s) &bull; ${requestFormState.estimatedWeight} kg</span>
            </div>
            <div class="review-row">
                <span class="review-label">Reported Condition:</span>
                <span class="review-value"><span class="badge badge-neutral">${requestFormState.condition}</span></span>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-title"><i class="fa-solid fa-location-dot"></i> Doorstep Pickup Location</div>
            <div class="review-row">
                <span class="review-label">Address:</span>
                <span class="review-value">${requestFormState.address}</span>
            </div>
            <div class="review-row">
                <span class="review-label">Area & Zone:</span>
                <span class="review-value">${requestFormState.area || 'Metro City'}, ${requestFormState.zone}</span>
            </div>
            <div class="review-row">
                <span class="review-label">Pincode:</span>
                <span class="review-value">${requestFormState.pincode}</span>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-title"><i class="fa-solid fa-clock"></i> Scheduled Date & Time</div>
            <div class="review-row">
                <span class="review-label">Date:</span>
                <span class="review-value">${new Date(requestFormState.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div class="review-row">
                <span class="review-label">Slot:</span>
                <span class="review-value">${requestFormState.timeSlot}</span>
            </div>
            ${requestFormState.notes ? `
            <div class="review-row">
                <span class="review-label">Special Notes:</span>
                <span class="review-value">${requestFormState.notes}</span>
            </div>` : ''}
        </div>

        <div class="review-section" style="background:#ECFDF5; padding:1rem; border-radius:var(--radius-md); border:1px solid #A7F3D0;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <span style="font-weight:700; color:#065F46; font-size:0.95rem;">
                    <i class="fa-solid fa-seedling"></i> Estimated Eco Points Earned:
                </span>
                <span style="font-size:1.25rem; font-weight:800; color:#047857;">+${pointsPreview} Pts</span>
            </div>
            <div style="font-size:0.775rem; color:#065F46; margin-top:0.25rem;">
                Based on category tier (${requestFormState.category}) and estimated weight (${requestFormState.estimatedWeight} kg).
            </div>
        </div>
    `;
}

/**
 * SMART COLLECTOR ASSIGNMENT ALGORITHM
 * Calculates distance, rating, availability status, active workload, and category compatibility.
 */
function findOptimalCollector(userLat, userLng, userCategory, userZone) {
    const collectors = getData(STORAGE_KEYS.COLLECTORS, []);

    if (!collectors || collectors.length === 0) {
        return null;
    }

    // Helper: Haversine distance in km
    function calculateDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(1));
    }

    // Score each collector
    const scoredCollectors = collectors.map(col => {
        const distance = calculateDistanceKm(userLat, userLng, col.lat, col.lng);

        // 1. Availability Weight
        let availabilityScore = 0;
        if (col.status === 'AVAILABLE') availabilityScore = 35;
        else if (col.status === 'BUSY') availabilityScore = 5;
        else availabilityScore = -50; // OFFLINE

        // 2. Rating Weight (Scaled 0 - 30)
        const ratingScore = (col.rating || 4.5) * 6;

        // 3. Distance Penalty (Closer is significantly better)
        const distanceScore = Math.max(0, 30 - (distance * 2));

        // 4. Workload Penalty
        const workloadScore = Math.max(0, 20 - ((col.activeRequestsCount || 0) * 5));

        // 5. Category Compatibility Bonus
        const supportsCategory = col.supportedCategories && col.supportedCategories.includes(userCategory);
        const categoryScore = supportsCategory ? 20 : -30;

        // 6. Zone match bonus
        const zoneScore = (col.zone === userZone) ? 10 : 0;

        const totalScore = parseFloat(
            (availabilityScore + ratingScore + distanceScore + workloadScore + categoryScore + zoneScore).toFixed(2)
        );

        return {
            collector: col,
            score: totalScore,
            distanceKm: distance,
            estimatedArrivalMin: Math.max(12, Math.round(distance * 3.5 + 8))
        };
    });

    // Sort descending by calculated score
    scoredCollectors.sort((a, b) => b.score - a.score);

    console.log("Smart Collector Assignment Ranking:", scoredCollectors);

    return scoredCollectors[0];
}

// Final confirmation and persistence
function handleRequestConfirmation() {
    const user = getCurrentUser();
    if (!user) return;

    const confirmBtn = document.getElementById('btn-confirm-pickup');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Assigning Best Collector...`;
    }

    setTimeout(() => {
        // Run Smart Assignment Algorithm
        const bestMatch = findOptimalCollector(
            requestFormState.lat,
            requestFormState.lng,
            requestFormState.category,
            requestFormState.zone
        );

        const assignedCollector = bestMatch ? bestMatch.collector : null;
        const distanceKm = bestMatch ? bestMatch.distanceKm : 3.4;
        const etaMins = bestMatch ? bestMatch.estimatedArrivalMin : 25;

        // Generate unique Request ID
        const requestId = generateId('EC');

        const calculatedEcoPoints = Math.round(
            requestFormState.estimatedWeight * 10 + (CATEGORY_POINTS[requestFormState.category] || 20)
        );

        const newRequest = {
            id: requestId,
            userId: user.id,
            userName: user.name,
            userPhone: user.phone || '+91 98765 43210',
            userEmail: user.email,
            category: requestFormState.category,
            deviceName: requestFormState.deviceName,
            quantity: requestFormState.quantity,
            estimatedWeight: requestFormState.estimatedWeight,
            actualWeight: null,
            condition: requestFormState.condition,
            image: requestFormState.imageDataUrl || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300',
            address: requestFormState.address,
            city: requestFormState.city,
            area: requestFormState.area,
            zone: requestFormState.zone,
            pincode: requestFormState.pincode,
            lat: requestFormState.lat,
            lng: requestFormState.lng,
            scheduledDate: requestFormState.date,
            timeSlot: requestFormState.timeSlot,
            status: assignedCollector ? 'ASSIGNED' : 'REQUESTED',
            collectorId: assignedCollector ? assignedCollector.id : null,
            collectorName: assignedCollector ? assignedCollector.name : null,
            collectorPhone: assignedCollector ? assignedCollector.phone : null,
            collectorAvatar: assignedCollector ? assignedCollector.avatar : null,
            collectorVehicle: assignedCollector ? assignedCollector.vehicle : null,
            collectorRating: assignedCollector ? assignedCollector.rating : null,
            distanceKm,
            estimatedArrivalMin: etaMins,
            ecoPointsEarned: 0,
            potentialPoints: calculatedEcoPoints,
            notes: requestFormState.notes,
            collectionProofUrl: null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        // Save into storage
        const requests = getData(STORAGE_KEYS.REQUESTS, []);
        requests.unshift(newRequest);
        saveData(STORAGE_KEYS.REQUESTS, requests);

        // Update collector workload if assigned
        if (assignedCollector) {
            const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
            const cIndex = collectors.findIndex(c => c.id === assignedCollector.id);
            if (cIndex !== -1) {
                collectors[cIndex].activeRequestsCount = (collectors[cIndex].activeRequestsCount || 0) + 1;
                saveData(STORAGE_KEYS.COLLECTORS, collectors);
            }
        }

        // Add Notification for User
        const notifications = getData(STORAGE_KEYS.NOTIFICATIONS, []);
        notifications.unshift({
            id: generateId('NOTIF'),
            userId: user.id,
            role: 'user',
            title: `Pickup Confirmed: ${requestId}`,
            message: assignedCollector
                ? `Assigned to ${assignedCollector.name} (${assignedCollector.vehicle}). Scheduled for ${newRequest.scheduledDate}.`
                : `Your pickup request has been recorded and is matching with regional collectors.`,
            type: 'tracking',
            link: `/user/tracking.html?id=${requestId}`,
            read: false,
            createdAt: new Date().toISOString()
        });

        // Add Notification for Collector
        if (assignedCollector) {
            notifications.unshift({
                id: generateId('NOTIF'),
                userId: assignedCollector.id,
                role: 'collector',
                title: `New Assignment: ${requestId}`,
                message: `New pickup in ${newRequest.area || newRequest.zone} (${newRequest.category}, ${newRequest.estimatedWeight}kg).`,
                type: 'collector_assigned',
                link: `/collector/pickup.html?id=${requestId}`,
                read: false,
                createdAt: new Date().toISOString()
            });
        }
        saveData(STORAGE_KEYS.NOTIFICATIONS, notifications);

        // Show Success Assignment Modal
        renderAssignmentSuccessModal(newRequest, assignedCollector, distanceKm, etaMins);
    }, 900);
}

// Render dynamic assignment popup dialog
function renderAssignmentSuccessModal(request, collector, distanceKm, etaMins) {
    let modal = document.getElementById('assignment-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'assignment-modal';
        modal.className = 'modal-backdrop';
        document.body.appendChild(modal);
    }

    const collectorHtml = collector ? `
        <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:var(--radius-lg); padding:1.25rem; margin:1.25rem 0; display:flex; align-items:center; gap:1rem;">
            <img src="${collector.avatar}" style="width:58px; height:58px; border-radius:50%; object-fit:cover; border:2px solid #16A34A;" alt="Collector">
            <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <strong style="font-size:1.05rem; color:var(--text-main);">${collector.name}</strong>
                    <span class="badge badge-success"><i class="fa-solid fa-star"></i> ${collector.rating}</span>
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                    <i class="fa-solid fa-truck"></i> ${collector.vehicle}
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                    <i class="fa-solid fa-location-arrow"></i> ${distanceKm} km away &bull; Est. pickup window: ~${etaMins} mins
                </div>
            </div>
        </div>
    ` : `
        <div style="background:#FEF3C7; padding:1rem; border-radius:var(--radius-md); margin:1rem 0; font-size:0.85rem; color:#92400E;">
            Your request is queued for dispatcher review. You will receive an alert once matched.
        </div>
    `;

    modal.innerHTML = `
        <div class="modal-content" style="text-align:center;">
            <div style="width:60px; height:60px; background:#DCFCE7; color:#16A34A; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.75rem; margin:0 auto 1rem;">
                <i class="fa-solid fa-check"></i>
            </div>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--text-main); margin-bottom:0.35rem;">
                Pickup Request Confirmed!
            </h2>
            <p style="font-size:0.875rem; color:var(--text-muted);">
                Request ID: <strong style="color:var(--text-main);">${request.id}</strong>
            </p>

            ${collectorHtml}

            <p style="font-size:0.825rem; color:var(--text-muted); margin-bottom:1.5rem;">
                Smart routing algorithm selected the optimal certified e-waste collector based on proximity, ratings, and vehicle compatibility.
            </p>

            <div style="display:flex; gap:0.75rem; justify-content:center;">
                <a href="requests.html" class="btn btn-outline">View My Requests</a>
                <a href="tracking.html?id=${request.id}" class="btn btn-primary">
                    <i class="fa-solid fa-location-crosshairs"></i> Track Pickup Live
                </a>
            </div>
        </div>
    `;

    openModal('assignment-modal');
}
