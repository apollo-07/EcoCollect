/**
 * EcoCollect - Two-Way Multi-Criteria Rating Module (rating.js)
 * Manages User -> Collector ratings (overall, punctuality, professionalism, communication, process)
 * and Collector -> User ratings (readiness, communication, cooperation), with dynamic score recalculation.
 */

function initRatingPage() {
    const user = requireAuth(['user']);
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const reqId = urlParams.get('id');

    const requests = getData(STORAGE_KEYS.REQUESTS, []);
    let targetRequest = null;

    if (reqId) {
        targetRequest = requests.find(r => r.id === reqId);
    } else {
        // Find most recent completed request by user that hasn't been rated yet
        const existingRatings = getData(STORAGE_KEYS.RATINGS, []);
        targetRequest = requests.find(r => 
            r.userId === user.id && 
            r.status === 'COMPLETED' &&
            !existingRatings.some(rat => rat.requestId === r.id)
        ) || requests.find(r => r.status === 'COMPLETED');
    }

    if (!targetRequest) {
        renderNoRatingAvailableState();
        return;
    }

    renderRatingTargetInfo(targetRequest);
    bindStarRatingControls();
    bindRatingSubmission(targetRequest, user);
}

function renderRatingTargetInfo(req) {
    const reqIdEl = document.getElementById('rating-request-id');
    const deviceEl = document.getElementById('rating-device-name');
    const collectorNameEl = document.getElementById('rating-collector-name');
    const collectorAvatarEl = document.getElementById('rating-collector-avatar');
    const collectorVehicleEl = document.getElementById('rating-collector-vehicle');

    if (reqIdEl) reqIdEl.textContent = req.id;
    if (deviceEl) deviceEl.textContent = `${req.category} (${req.deviceName})`;
    if (collectorNameEl) collectorNameEl.textContent = req.collectorName || 'Rajesh Kumar';
    if (collectorVehicleEl) collectorVehicleEl.textContent = req.collectorVehicle || 'Certified EV Collection Vehicle';
    if (collectorAvatarEl && req.collectorAvatar) collectorAvatarEl.src = req.collectorAvatar;
}

function bindStarRatingControls() {
    // Overall star click handler
    document.querySelectorAll('.star-rating-control input').forEach(input => {
        input.addEventListener('change', (e) => {
            const score = e.target.value;
            const scoreDisplay = document.getElementById('overall-score-display');
            if (scoreDisplay) scoreDisplay.textContent = `${score} / 5 Stars`;
        });
    });

    // Sub-criteria pill/star rating listeners
    document.querySelectorAll('.sub-rating-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const group = pill.closest('.sub-rating-group');
            if (group) {
                group.querySelectorAll('.sub-rating-pill').forEach(p => p.classList.remove('selected'));
                pill.classList.add('selected');
            }
        });
    });
}

function bindRatingSubmission(req, user) {
    const form = document.getElementById('rating-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const overallInput = document.querySelector('input[name="overall_rating"]:checked');
        const overallRating = overallInput ? parseInt(overallInput.value) : 5;

        // Sub criteria values (default to 5 if not touched)
        const punctuality = getSelectedSubRating('punctuality') || 5;
        const professionalism = getSelectedSubRating('professionalism') || 5;
        const communication = getSelectedSubRating('communication') || 5;
        const processRating = getSelectedSubRating('process') || 5;

        const commentInput = document.getElementById('rating-comment');
        const comment = commentInput ? commentInput.value.trim() : '';

        // Save rating record
        const ratings = getData(STORAGE_KEYS.RATINGS, []);
        const newRating = {
            id: generateId('RAT'),
            requestId: req.id,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            collectorId: req.collectorId || 'COL-001',
            collectorName: req.collectorName || 'Rajesh Kumar',
            overallRating,
            punctuality,
            professionalism,
            communication,
            processRating,
            comment: comment || 'Collector arrived on time and handled the devices safely.',
            createdAt: new Date().toISOString()
        };

        ratings.unshift(newRating);
        saveData(STORAGE_KEYS.RATINGS, ratings);

        // Recalculate collector average rating
        recalculateCollectorRating(newRating.collectorId);

        showToast('Rating Submitted! ★', 'Thank you! Your feedback helps maintain high standards.', 'success');

        setTimeout(() => {
            window.location.href = 'requests.html';
        }, 1200);
    });
}

function getSelectedSubRating(groupName) {
    const selected = document.querySelector(`.sub-rating-group[data-group="${groupName}"] .sub-rating-pill.selected`);
    return selected ? parseInt(selected.getAttribute('data-value')) : null;
}

// Dynamically Recalculates Collector's Average Rating
function recalculateCollectorRating(collectorId) {
    const ratings = getData(STORAGE_KEYS.RATINGS, []);
    const collectorRatings = ratings.filter(r => r.collectorId === collectorId);

    if (collectorRatings.length > 0) {
        const sum = collectorRatings.reduce((acc, curr) => acc + (curr.overallRating || 5), 0);
        const newAvg = parseFloat((sum / collectorRatings.length).toFixed(2));

        const collectors = getData(STORAGE_KEYS.COLLECTORS, []);
        const cIndex = collectors.findIndex(c => c.id === collectorId);
        if (cIndex !== -1) {
            collectors[cIndex].rating = newAvg;
            collectors[cIndex].ratingsCount = collectorRatings.length;
            saveData(STORAGE_KEYS.COLLECTORS, collectors);
            console.log(`Recalculated rating for collector ${collectorId}: ${newAvg} (${collectorRatings.length} reviews)`);
        }
    }
}

// Two-way Rating: Collector rating customer
function submitCollectorToUserRating(requestId, userId, collectorId, ratingData) {
    const ratings = getData(STORAGE_KEYS.RATINGS, []);
    const match = ratings.find(r => r.requestId === requestId);

    if (match) {
        match.collectorToUserRating = {
            readiness: ratingData.readiness || 5,
            communication: ratingData.communication || 5,
            cooperation: ratingData.cooperation || 5,
            comment: ratingData.comment || 'Smooth handover.'
        };
        saveData(STORAGE_KEYS.RATINGS, ratings);
    } else {
        ratings.unshift({
            id: generateId('RAT'),
            requestId,
            userId,
            collectorId,
            collectorToUserRating: {
                readiness: ratingData.readiness || 5,
                communication: ratingData.communication || 5,
                cooperation: ratingData.cooperation || 5,
                comment: ratingData.comment || 'Smooth handover.'
            },
            createdAt: new Date().toISOString()
        });
        saveData(STORAGE_KEYS.RATINGS, ratings);
    }

    showToast('Customer Rated', 'Your evaluation of the customer has been recorded.', 'success');
}

function renderNoRatingAvailableState() {
    const container = document.getElementById('rating-container');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-star-half-stroke empty-state-icon" style="color:#F59E0B;"></i>
                <h3 class="empty-state-title">No Pending Reviews</h3>
                <p class="empty-state-text">You have no completed e-waste pickups awaiting feedback at this moment.</p>
                <a href="requests.html" class="btn btn-outline"><i class="fa-solid fa-list-check"></i> View My Requests</a>
            </div>
        `;
    }
}
