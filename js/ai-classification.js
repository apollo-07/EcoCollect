/**
 * EcoCollect - AI E-Waste Classification Service (ai-classification.js)
 * 
 * NOTE ON PROTOTYPE ARCHITECTURE:
 * This module is a prototype/mock AI service designed for demonstration and architectural scaffolding.
 * It simulates deep computer vision inference on uploaded e-waste imagery.
 * 
 * TO CONNECT A REAL ML/AI MODEL IN PRODUCTION:
 * Replace the `_mockPredict()` method with an actual endpoint call, for example:
 *   const response = await fetch('/api/v1/ml/classify-ewaste', {
 *       method: 'POST',
 *       body: formDataWithImage
 *   });
 *   return await response.json();
 */

const AIClassifierService = {
    // Database of recognizable e-waste archetypes for simulated inference
    _mockKnowledgeBase: [
        {
            keywords: ['laptop', 'notebook', 'macbook', 'thinkpad'],
            detectedObject: 'Laptop Computer',
            category: 'Laptop',
            condition: 'Partially Working',
            confidence: 0.96,
            recommendedAction: 'Refurbish or Secondary Component Recovery',
            hazardousComponents: ['Lithium-ion Battery Pack', 'Mercury CCFL / LED Backlight', 'Lead-Tin Solder'],
            estimatedWeightKg: 2.2,
            recyclabilityScore: '88% Recyclable'
        },
        {
            keywords: ['phone', 'mobile', 'iphone', 'samsung', 'android'],
            detectedObject: 'Smartphone Handset',
            category: 'Mobile Phone',
            condition: 'Damaged',
            confidence: 0.98,
            recommendedAction: 'Urban Mining / Precious Metal Extraction (Au, Ag, Cu)',
            hazardousComponents: ['Cobalt-Lithium Polymer Cell', 'Arsenic in micro-dopants'],
            estimatedWeightKg: 0.35,
            recyclabilityScore: '94% Recyclable'
        },
        {
            keywords: ['tv', 'television', 'screen', 'display'],
            detectedObject: 'Flat Panel Television / Display',
            category: 'Television',
            condition: 'Not Working',
            confidence: 0.93,
            recommendedAction: 'Safe Phosphor & Polarization Film Separation',
            hazardousComponents: ['Mercury Vapor Lamps (if CCFL)', 'Lead in CRT/Glass frit'],
            estimatedWeightKg: 12.0,
            recyclabilityScore: '82% Recyclable'
        },
        {
            keywords: ['battery', 'cell', 'pack', 'ups'],
            detectedObject: 'Chemical Battery / Power Storage Cell',
            category: 'Battery',
            condition: 'Damaged',
            confidence: 0.95,
            recommendedAction: 'Specialized Hydrometallurgical Hazardous Neutralization',
            hazardousComponents: ['Sulfuric Acid / Lithium Hexafluorophosphate', 'Cadmium / Nickel'],
            estimatedWeightKg: 4.5,
            recyclabilityScore: '95% Neutralizable'
        },
        {
            keywords: ['printer', 'scanner', 'copier'],
            detectedObject: 'Multi-Function Inkjet / Laser Printer',
            category: 'Printer',
            condition: 'Not Working',
            confidence: 0.91,
            recommendedAction: 'Toner Dust Filtration & High-Impact Polystyrene Recovery',
            hazardousComponents: ['Carbon Black Toner Particulates', 'Ozone-generating Corotrons'],
            estimatedWeightKg: 6.8,
            recyclabilityScore: '76% Recyclable'
        },
        {
            keywords: ['desktop', 'cpu', 'tower', 'pc'],
            detectedObject: 'Desktop Computer Tower (ATX)',
            category: 'Desktop',
            condition: 'Partially Working',
            confidence: 0.94,
            recommendedAction: 'Motherboard Gold-Finger Stripping & Steel Demanufacturing',
            hazardousComponents: ['Beryllium Copper Springs', 'Flame Retardant Resins (BFRs)'],
            estimatedWeightKg: 8.5,
            recyclabilityScore: '92% Recyclable'
        }
    ],

    /**
     * Primary Classification Pipeline
     * @param {File|string} imageFileOrUrl - The uploaded image file or preview URL
     * @param {string} optionalFileNameHint - Filename hint if available
     * @returns {Promise<Object>} Analyzed classification details
     */
    async classifyImage(imageFileOrUrl, optionalFileNameHint = '') {
        // Simulated network/inference latency (1.2 seconds)
        await new Promise(resolve => setTimeout(resolve, 1200));

        // In production: Send FormData to Vision API
        return this._mockPredict(optionalFileNameHint);
    },

    /**
     * Internal mock inference simulator
     */
    _mockPredict(fileNameHint = '') {
        const lowerHint = fileNameHint.toLowerCase();
        
        let match = this._mockKnowledgeBase.find(item => 
            item.keywords.some(k => lowerHint.includes(k))
        );

        // Fallback to random archetype if no filename match
        if (!match) {
            const randomIndex = Math.floor(Math.random() * this._mockKnowledgeBase.length);
            match = this._mockKnowledgeBase[randomIndex];
        }

        return {
            status: 'success',
            model: 'EcoCollect-VisionNet-v1.4 (Mock Service)',
            detectedObject: match.detectedObject,
            category: match.category,
            condition: match.condition,
            confidence: (match.confidence * 100).toFixed(1) + '%',
            recommendedAction: match.recommendedAction,
            hazardousComponents: match.hazardousComponents,
            estimatedWeightKg: match.estimatedWeightKg,
            recyclabilityScore: match.recyclabilityScore,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Helper to render the AI analysis card in the UI
     */
    renderResults(containerEl, result, onAutoFillCallback) {
        if (!containerEl) return;

        const hazardList = result.hazardousComponents.join(', ');

        containerEl.innerHTML = `
            <div class="ai-classifier-header">
                <div class="ai-badge">
                    <i class="fa-solid fa-microchip"></i> AI Vision Model: Verified
                </div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
                    Confidence: ${result.confidence}
                </span>
            </div>

            <div class="ai-results-grid">
                <div class="ai-result-item">
                    <div class="ai-result-label">Detected Object</div>
                    <div class="ai-result-val">${result.detectedObject}</div>
                </div>
                <div class="ai-result-item">
                    <div class="ai-result-label">Category Match</div>
                    <div class="ai-result-val">${result.category}</div>
                </div>
                <div class="ai-result-item">
                    <div class="ai-result-label">Detected Condition</div>
                    <div class="ai-result-val">${result.condition}</div>
                </div>
                <div class="ai-result-item">
                    <div class="ai-result-label">Est. Weight</div>
                    <div class="ai-result-val">${result.estimatedWeightKg} kg</div>
                </div>
            </div>

            <div style="font-size: 0.825rem; color: var(--text-main); margin: 0.5rem 0;">
                <strong>Recommended Lifecycle Action:</strong> ${result.recommendedAction}
            </div>

            <div class="ai-hazard-alert">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <div>
                    <strong>Potential Hazardous Components:</strong>
                    <div>${hazardList}</div>
                </div>
            </div>

            <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-sm btn-primary" id="ai-apply-btn">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Auto-fill into Request Form
                </button>
            </div>
        `;

        containerEl.style.display = 'block';

        const applyBtn = containerEl.querySelector('#ai-apply-btn');
        if (applyBtn && typeof onAutoFillCallback === 'function') {
            applyBtn.addEventListener('click', () => {
                onAutoFillCallback(result);
                showToast('AI Auto-Fill Applied', `Form filled with detected ${result.category} details!`, 'success');
            });
        }
    }
};

// Expose globally
if (typeof window !== 'undefined') {
    window.AIClassifierService = AIClassifierService;
}
