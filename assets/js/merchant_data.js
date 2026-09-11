/**
 * ==========================================================================
 * HELLO SOLAR MERCHANT — DATA MANAGEMENT & SCHEMA ENGINE
 * Single authoritative source loader for assets/data/merchant.json.
 * Dynamic summary calculation, strict schema validation, referential
 * integrity checks, offline resilience, and preview dataset loader.
 * ==========================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MerchantData = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const STORAGE_KEY_CUSTOM_DATA = 'hello_solar_merchant_custom_dataset';
    const STORAGE_KEY_PREFS = 'hello_solar_merchant_user_prefs';

    // --------------------------------------------------------------------------
    // 1. IN-MEMORY CACHE
    // --------------------------------------------------------------------------
    let cachedDataset = null;

    // --------------------------------------------------------------------------
    // 2. SCHEMA VALIDATOR & REFERENTIAL INTEGRITY
    // --------------------------------------------------------------------------
    const ALLOWED_STAGES = [
        "Site Survey",
        "Engineering Approval",
        "Permitting",
        "Structural Mounting",
        "Inverter & Grid-Tie Testing",
        "Completed"
    ];

    const ALLOWED_PAYOUT_STATUSES = [
        "Released",
        "Pending Review",
        "On Hold"
    ];

    function validateDataset(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            return { valid: false, errors: ['Dataset must be a valid JSON object.'] };
        }

        // 1. Merchant profile validation
        if (!data.merchant || typeof data.merchant !== 'object') {
            errors.push('Missing "merchant" object section.');
        } else {
            if (!data.merchant.companyName) errors.push('merchant.companyName is required.');
            if (!data.merchant.merchantId) errors.push('merchant.merchantId is required.');
        }

        // 2. Projects array validation
        const projectIds = new Set();
        if (!Array.isArray(data.projects)) {
            errors.push('"projects" must be an array.');
        } else {
            data.projects.forEach((p, idx) => {
                const prefix = `projects[${idx}]`;
                if (!p.id || typeof p.id !== 'string') {
                    errors.push(`${prefix}: Missing or invalid "id".`);
                } else {
                    if (projectIds.has(p.id)) {
                        errors.push(`${prefix}: Duplicate project ID "${p.id}".`);
                    }
                    projectIds.add(p.id);
                }
                if (!p.customerName) errors.push(`${prefix}: Missing "customerName".`);
                if (!p.location) errors.push(`${prefix}: Missing "location".`);
                if (!p.systemCapacity) errors.push(`${prefix}: Missing "systemCapacity".`);
                if (typeof p.progress !== 'number' || p.progress < 0 || p.progress > 100) {
                    errors.push(`${prefix} ("${p.id || 'unknown'}"): "progress" must be a number between 0 and 100.`);
                }
                if (typeof p.projectValue !== 'number' || p.projectValue < 0) {
                    errors.push(`${prefix} ("${p.id || 'unknown'}"): "projectValue" must be a non-negative number.`);
                }
            });
        }

        // 3. Payouts array validation & referential integrity check
        if (!Array.isArray(data.payouts)) {
            errors.push('"payouts" must be an array.');
        } else {
            data.payouts.forEach((pay, idx) => {
                const prefix = `payouts[${idx}]`;
                if (!pay.payoutId) errors.push(`${prefix}: Missing "payoutId".`);
                if (!pay.projectId) {
                    errors.push(`${prefix}: Missing "projectId".`);
                } else if (!projectIds.has(pay.projectId)) {
                    errors.push(`${prefix} ("${pay.payoutId || 'unknown'}"): References unknown projectId "${pay.projectId}".`);
                }
                if (typeof pay.netDisbursement !== 'number' || pay.netDisbursement < 0) {
                    errors.push(`${prefix} ("${pay.payoutId || 'unknown'}"): "netDisbursement" must be a non-negative number.`);
                }
                if (!ALLOWED_PAYOUT_STATUSES.includes(pay.status)) {
                    errors.push(`${prefix} ("${pay.payoutId || 'unknown'}"): Invalid status "${pay.status}". Allowed: ${ALLOWED_PAYOUT_STATUSES.join(', ')}.`);
                }
            });
        }

        // 4. Crews validation
        if (!Array.isArray(data.crews)) {
            errors.push('"crews" must be an array.');
        } else {
            data.crews.forEach((c, idx) => {
                if (!c.crewId) errors.push(`crews[${idx}]: Missing "crewId".`);
                if (!c.teamName) errors.push(`crews[${idx}]: Missing "teamName".`);
            });
        }

        // 5. Milestones validation
        if (data.milestones && Array.isArray(data.milestones)) {
            data.milestones.forEach((m, idx) => {
                if (m.projectId && !projectIds.has(m.projectId)) {
                    errors.push(`milestones[${idx}]: References unknown projectId "${m.projectId}".`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // --------------------------------------------------------------------------
    // 3. DYNAMIC SUMMARY & KPI CALCULATIONS (Derived from data)
    // --------------------------------------------------------------------------
    function calculateSummary(dataset) {
        if (!dataset) return {};

        const projects = Array.isArray(dataset.projects) ? dataset.projects : [];
        const payouts = Array.isArray(dataset.payouts) ? dataset.payouts : [];
        const crews = Array.isArray(dataset.crews) ? dataset.crews : [];

        const activeProjects = projects.filter(p => p.progress < 100);
        const completedProjects = projects.filter(p => p.progress === 100);

        const totalPortfolioValue = projects.reduce((sum, p) => sum + (Number(p.projectValue) || 0), 0);
        const totalPaidAmount = payouts
            .filter(p => p.status === 'Released')
            .reduce((sum, p) => sum + (Number(p.netDisbursement) || 0), 0);

        const pendingPayoutsAmount = payouts
            .filter(p => p.status === 'Pending Review')
            .reduce((sum, p) => sum + (Number(p.netDisbursement) || 0), 0);

        const onHoldPayoutsAmount = payouts
            .filter(p => p.status === 'On Hold')
            .reduce((sum, p) => sum + (Number(p.netDisbursement) || 0), 0);

        // Find next scheduled release date from pending records
        const scheduledPayout = payouts.find(p => p.status === 'Pending Review' && p.releaseDate && p.releaseDate.includes('Sept'));
        const nextReleaseDate = scheduledPayout ? scheduledPayout.releaseDate.replace('Scheduled for ', '') : 'Sept 15, 2026';

        return {
            activeInstallsCount: activeProjects.length,
            completedProjectsCount: completedProjects.length,
            portfolioValuePhp: totalPortfolioValue,
            totalPaidPhp: totalPaidAmount,
            pendingPayoutsPhp: pendingPayoutsAmount,
            onHoldPayoutsPhp: onHoldPayoutsAmount,
            activeCrewsCount: crews.length,
            nextReleaseDate: nextReleaseDate
        };
    }

    // --------------------------------------------------------------------------
    // 4. USER PROFILE PREFERENCES PERSISTENCE
    // --------------------------------------------------------------------------
    function applyUserPreferences(merchant) {
        if (!merchant) return merchant;
        try {
            const raw = localStorage.getItem(STORAGE_KEY_PREFS);
            if (raw) {
                const prefs = JSON.parse(raw);
                if (prefs && typeof prefs === 'object') {
                    if (prefs.companyName) merchant.companyName = prefs.companyName;
                    if (prefs.contactPerson) merchant.contactPerson = prefs.contactPerson;
                    if (prefs.phone) merchant.phone = prefs.phone;
                    if (merchant.payoutPreferences) {
                        if (prefs.preferredBank) merchant.payoutPreferences.preferredBank = prefs.preferredBank;
                        if (prefs.accountName) merchant.payoutPreferences.accountName = prefs.accountName;
                        if (prefs.accountNumberMasked) merchant.payoutPreferences.accountNumberMasked = prefs.accountNumberMasked;
                    }
                }
            }
        } catch (e) {
            console.warn('[MerchantData] Error loading user preferences:', e);
        }
        return merchant;
    }

    function saveUserPreferences(prefs) {
        try {
            localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
            if (cachedDataset && cachedDataset.merchant) {
                applyUserPreferences(cachedDataset.merchant);
            }
            return true;
        } catch (e) {
            console.error('[MerchantData] Error saving user preferences:', e);
            return false;
        }
    }

    // --------------------------------------------------------------------------
    // 5. AUTHORITATIVE DATA LOADER & CACHE
    // --------------------------------------------------------------------------
    async function loadAllData(forceReload = false) {
        if (!forceReload && cachedDataset) {
            return cachedDataset;
        }

        // Check if user uploaded a custom preview dataset
        try {
            const customRaw = localStorage.getItem(STORAGE_KEY_CUSTOM_DATA);
            if (customRaw) {
                const parsed = JSON.parse(customRaw);
                const validation = validateDataset(parsed);
                if (validation.valid) {
                    cachedDataset = parsed;
                    applyUserPreferences(cachedDataset.merchant);
                    return cachedDataset;
                }
            }
        } catch (e) {
            console.warn('[MerchantData] Error reading custom dataset from localStorage:', e);
        }

        // Fetch authoritative assets/data/merchant.json
        try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

            const response = await fetch('assets/data/merchant.json', {
                cache: 'no-cache',
                signal: controller ? controller.signal : undefined
            });

            if (timeoutId) clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const validation = validateDataset(data);
                if (validation.valid) {
                    cachedDataset = data;
                    applyUserPreferences(cachedDataset.merchant);
                    // Cache in localStorage for offline / file:/// protocol resilience
                    try {
                        localStorage.setItem('hello_solar_merchant_cached_default', JSON.stringify(data));
                    } catch (e) {}
                    return cachedDataset;
                } else {
                    console.error('[MerchantData] Schema validation failed for merchant.json:', validation.errors);
                }
            }
        } catch (err) {
            console.warn('[MerchantData] Automated fetch failed (likely file:/// protocol or offline). Using offline cache.');
        }

        // Fallback: Check cached default in localStorage
        try {
            const storedDefault = localStorage.getItem('hello_solar_merchant_cached_default');
            if (storedDefault) {
                const parsed = JSON.parse(storedDefault);
                if (validateDataset(parsed).valid) {
                    cachedDataset = parsed;
                    applyUserPreferences(cachedDataset.merchant);
                    return cachedDataset;
                }
            }
        } catch (e) {}

        // Fallback default structure if all else fails
        cachedDataset = getBaselineDataset();
        applyUserPreferences(cachedDataset.merchant);
        return cachedDataset;
    }

    function getBaselineDataset() {
        return {
            merchant: {
                companyName: "SolarTech Manila",
                merchantId: "MCH-77412",
                accountType: "Merchant Partner",
                verificationStatus: "Accreditation on File",
                contactPerson: "Marco Santos",
                email: "merchant@hellosolar.ph",
                phone: "+63 917 888 2026",
                partnerTier: "Gold Certified Partner",
                commissionRate: "5.2% Tier A Commission",
                accountManager: "David Ramos",
                payoutPreferences: {
                    preferredBank: "BDO Unibank",
                    accountName: "SolarTech Manila Corp.",
                    accountNumberMasked: "**** **** 9012",
                    payoutSchedule: "Bi-Monthly (1st & 15th)"
                }
            },
            projects: [],
            payouts: [],
            crews: [],
            milestones: [],
            support: { categories: [], faqs: [] },
            activity: []
        };
    }

    // --------------------------------------------------------------------------
    // 6. CUSTOM DATASET APPLIER & RESET
    // --------------------------------------------------------------------------
    function applyCustomDataset(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const validation = validateDataset(data);
            if (!validation.valid) {
                return { success: false, errors: validation.errors };
            }

            localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(data));
            cachedDataset = data;
            applyUserPreferences(cachedDataset.merchant);
            return { success: true };
        } catch (err) {
            return { success: false, errors: [`JSON Parse Error: ${err.message}`] };
        }
    }

    function resetDefaultDataset() {
        try {
            localStorage.removeItem(STORAGE_KEY_CUSTOM_DATA);
            cachedDataset = null;
            return true;
        } catch (e) {
            return false;
        }
    }

    // --------------------------------------------------------------------------
    // 7. SPECIFIC GETTERS
    // --------------------------------------------------------------------------
    async function loadMerchantData(forceReload = false) {
        const dataset = await loadAllData(forceReload);
        return dataset.merchant;
    }

    async function loadProjects(forceReload = false) {
        const dataset = await loadAllData(forceReload);
        return Array.isArray(dataset.projects) ? dataset.projects : [];
    }

    async function loadPayouts(forceReload = false) {
        const dataset = await loadAllData(forceReload);
        return Array.isArray(dataset.payouts) ? dataset.payouts : [];
    }

    async function loadInstallers(forceReload = false) {
        const dataset = await loadAllData(forceReload);
        return Array.isArray(dataset.crews) ? dataset.crews : [];
    }

    async function loadMilestones(forceReload = false) {
        const dataset = await loadAllData(forceReload);
        return Array.isArray(dataset.milestones) ? dataset.milestones : [];
    }

    async function loadFAQs(forceReload = false) {
        const dataset = await loadAllData(forceReload);
        if (dataset.support && Array.isArray(dataset.support.faqs)) {
            return dataset.support.faqs;
        }
        return [];
    }

    async function loadSupportCategories(forceReload = false) {
        const dataset = await loadAllData(forceReload);
        if (dataset.support && Array.isArray(dataset.support.categories)) {
            return dataset.support.categories;
        }
        return [];
    }

    async function loadActivityLogs(forceReload = false) {
        const dataset = await loadAllData(forceReload);
        return Array.isArray(dataset.activity) ? dataset.activity : [];
    }

    async function getProjectById(projectId) {
        const list = await loadProjects();
        return list.find(p => p.id === projectId) || null;
    }

    async function getPayoutById(payoutId) {
        const list = await loadPayouts();
        return list.find(p => p.payoutId === payoutId) || null;
    }

    async function getInstallerById(crewId) {
        const list = await loadInstallers();
        return list.find(c => c.crewId === crewId) || null;
    }

    // --------------------------------------------------------------------------
    // 8. FORMATTERS & UTILITIES
    // --------------------------------------------------------------------------
    function formatCurrency(amount) {
        const num = Number(amount) || 0;
        try {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(num);
        } catch (e) {
            return '₱' + Math.round(num).toLocaleString('en-US');
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        return String(dateStr);
    }

    function escapeCSV(value) {
        const str = String(value ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    function downloadCSV(records, filename = 'merchant-records.csv') {
        if (!records || !records.length) {
            alert('No records available to download.');
            return;
        }

        const headers = Object.keys(records[0]);
        const csvRows = [];

        // Header row
        csvRows.push(headers.map(h => escapeCSV(h.replace(/([A-Z])/g, ' $1').trim())).join(','));

        // Value rows
        records.forEach(row => {
            csvRows.push(headers.map(header => escapeCSV(row[header])).join(','));
        });

        const csvContent = '\uFEFF' + csvRows.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // --------------------------------------------------------------------------
    // 9. PUBLIC API EXPORT
    // --------------------------------------------------------------------------
    return {
        loadAllData,
        loadMerchantData,
        loadProjects,
        loadPayouts,
        loadInstallers,
        loadMilestones,
        loadFAQs,
        loadSupportCategories,
        loadActivityLogs,
        getProjectById,
        getPayoutById,
        getInstallerById,
        formatCurrency,
        formatDate,
        downloadCSV,
        escapeCSV,
        saveUserPreferences,
        applyUserPreferences,
        validateDataset,
        calculateSummary,
        applyCustomDataset,
        resetDefaultDataset
    };
}));
