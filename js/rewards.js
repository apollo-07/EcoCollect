/**
 * EcoCollect - Eco Points & Reward Store Module (rewards.js)
 * Manages user points balance, carbon offset equivalents, coupon redemptions,
 * and redemption history.
 */

function initRewardsPage() {
    const user = requireAuth(['user']);
    if (!user) return;

    renderUserImpactStats(user);
    renderRewardsCatalog(user);
    renderRedemptionHistory(user);
}

// Environmental Contribution & Points Overview
function renderUserImpactStats(user) {
    const pointsEl = document.getElementById('user-eco-points-balance');
    const totalWasteEl = document.getElementById('user-total-waste-kg');
    const co2SavedEl = document.getElementById('user-co2-saved');
    const toxicDivertedEl = document.getElementById('user-toxic-diverted');
    const treesEquivEl = document.getElementById('user-trees-equivalent');

    const points = user.ecoPoints || 0;
    const wasteKg = user.totalWasteKg || 0;

    // Environmental calculation formulas:
    // 1 kg e-waste recycled prevents ~1.44 kg CO2 greenhouse gas emissions
    // 1 kg e-waste contains ~0.08 kg of hazardous heavy metals (lead, cadmium, mercury)
    // ~20 kg e-waste recycled roughly equates to the carbon absorption of 1 mature tree for a year
    const co2AvoidedKg = (wasteKg * 1.44).toFixed(1);
    const toxicSavedKg = (wasteKg * 0.08).toFixed(2);
    const treesCount = Math.max(1, Math.round(wasteKg / 15));

    if (pointsEl) pointsEl.textContent = points.toLocaleString();
    if (totalWasteEl) totalWasteEl.textContent = `${wasteKg} kg`;
    if (co2SavedEl) co2SavedEl.textContent = `${co2AvoidedKg} kg`;
    if (toxicDivertedEl) toxicDivertedEl.textContent = `${toxicSavedKg} kg`;
    if (treesEquivEl) treesEquivEl.textContent = `${treesCount} Trees`;
}

// Render Rewards Catalog
function renderRewardsCatalog(user) {
    const container = document.getElementById('rewards-catalog-grid');
    if (!container) return;

    const catalog = getData(STORAGE_KEYS.REWARDS, []);
    const userPoints = user.ecoPoints || 0;

    container.innerHTML = catalog.map(reward => {
        const canAfford = userPoints >= reward.pointsCost;

        return `
            <div class="stat-card" style="display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;">
                ${reward.badge ? `<span class="badge badge-primary" style="position:absolute; top:12px; right:12px;">${reward.badge}</span>` : ''}
                <div>
                    <div style="width:48px; height:48px; border-radius:var(--radius-md); background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:1rem;">
                        <i class="fa-solid ${reward.icon || 'fa-gift'}"></i>
                    </div>
                    <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">${reward.partner}</div>
                    <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-main); margin:0.25rem 0 0.5rem;">${reward.title}</h3>
                    <p style="font-size:0.825rem; color:var(--text-muted); line-height:1.4; margin-bottom:1rem;">${reward.description}</p>
                </div>

                <div style="border-top:1px solid var(--border-color); padding-top:1rem; display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <div style="font-size:0.7rem; color:var(--text-light); text-transform:uppercase; font-weight:700;">Cost</div>
                        <div style="font-size:1.15rem; font-weight:800; color:var(--primary);">${reward.pointsCost} Pts</div>
                    </div>

                    <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-outline'}" 
                            ${canAfford ? '' : 'disabled'}
                            onclick="handleClaimReward('${reward.id}')">
                        ${canAfford ? '<i class="fa-solid fa-gift"></i> Redeem' : 'Need More Points'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Reward Claim Handler
function handleClaimReward(rewardId) {
    const user = getCurrentUser();
    if (!user) return;

    const catalog = getData(STORAGE_KEYS.REWARDS, []);
    const reward = catalog.find(r => r.id === rewardId);
    if (!reward) return;

    if ((user.ecoPoints || 0) < reward.pointsCost) {
        showToast('Insufficient Points', `You need ${reward.pointsCost} Eco Points to claim this reward.`, 'warning');
        return;
    }

    if (!confirm(`Redeem ${reward.pointsCost} points for "${reward.title}"?`)) {
        return;
    }

    // Deduct points
    user.ecoPoints -= reward.pointsCost;
    setCurrentUser(user);

    // Update in users table
    const users = getData(STORAGE_KEYS.USERS, []);
    const uIndex = users.findIndex(u => u.id === user.id);
    if (uIndex !== -1) {
        users[uIndex].ecoPoints = user.ecoPoints;
        saveData(STORAGE_KEYS.USERS, users);
    }

    // Generate coupon code
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const couponCode = `${reward.codeTemplate}${randomSuffix}`;

    const newRedemption = {
        id: generateId('RED'),
        userId: user.id,
        rewardId: reward.id,
        rewardTitle: reward.title,
        pointsSpent: reward.pointsCost,
        couponCode,
        redeemedAt: new Date().toISOString(),
        status: 'Active',
        expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    };

    const redemptions = getData('ecocollect_user_redemptions', []);
    redemptions.unshift(newRedemption);
    saveData('ecocollect_user_redemptions', redemptions);

    // Add Notification
    const notifs = getData(STORAGE_KEYS.NOTIFICATIONS, []);
    notifs.unshift({
        id: generateId('NOTIF'),
        userId: user.id,
        role: 'user',
        title: 'Reward Redeemed! 🎉',
        message: `Your code ${couponCode} for ${reward.title} is ready to use.`,
        type: 'points',
        link: '/user/rewards.html',
        read: false,
        createdAt: new Date().toISOString()
    });
    saveData(STORAGE_KEYS.NOTIFICATIONS, notifs);

    showToast('Reward Claimed! 🎁', `Code: ${couponCode}`, 'success');

    // Refresh UI
    renderUserImpactStats(user);
    renderRewardsCatalog(user);
    renderRedemptionHistory(user);
}

// Render Past Redemptions Table
function renderRedemptionHistory(user) {
    const container = document.getElementById('redemptions-history-list');
    if (!container) return;

    const redemptions = getData('ecocollect_user_redemptions', []).filter(r => r.userId === user.id || !r.userId);

    if (redemptions.length === 0) {
        container.innerHTML = `
            <div style="padding:2rem; text-align:center; color:var(--text-muted); font-size:0.875rem;">
                No rewards redeemed yet. Schedule pickups to earn points!
            </div>
        `;
        return;
    }

    container.innerHTML = redemptions.map(r => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:0.85rem 1rem; border-bottom:1px solid var(--border-color); flex-wrap:wrap; gap:0.5rem;">
            <div>
                <strong style="color:var(--text-main); font-size:0.9rem;">${r.rewardTitle}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                    Claimed on ${new Date(r.redeemedAt).toLocaleDateString()} &bull; Expires ${r.expiryDate}
                </div>
            </div>

            <div style="display:flex; align-items:center; gap:0.75rem;">
                <code style="background:#F1F5F9; padding:0.25rem 0.65rem; border-radius:var(--radius-sm); font-weight:700; color:var(--secondary); font-size:0.85rem;">
                    ${r.couponCode}
                </code>
                <button class="btn btn-sm btn-outline" onclick="navigator.clipboard.writeText('${r.couponCode}'); showToast('Copied!', 'Promo code copied to clipboard', 'info');">
                    <i class="fa-regular fa-copy"></i>
                </button>
            </div>
        </div>
    `).join('');
}
