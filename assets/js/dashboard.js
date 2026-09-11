/**
 * ==========================================================================
 * HELLO SOLAR MERCHANT — DASHBOARD & PORTAL INTERACTIONS
 * Shared navigation, mobile bottom nav, dynamic topbar profile,
 * modal dialogs, search & filtering, CSV exports, support draft preservation,
 * deep-linking router, and local preview data loader.
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", async () => {
    'use strict';

    // --------------------------------------------------------------------------
    // 1. PAGE IDENTIFICATION & ACTIVE NAVIGATION
    // --------------------------------------------------------------------------
    const rawPath = window.location.pathname.split("/").pop().toLowerCase() || "dashboard.html";
    let currentPage = document.body.dataset.page || rawPath.replace(".html", "") || "dashboard";
    if (currentPage === "index" || currentPage === "") currentPage = "dashboard";

    const navItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            href: "dashboard.html",
            icon: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z"/></svg>'
        },
        {
            id: "payments",
            label: "Payments",
            href: "payments.html",
            icon: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h3" stroke-linecap="round"/></svg>'
        },
        {
            id: "installers",
            label: "Installers",
            href: "installers.html",
            icon: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 6.5 3-3 3 3-3 3m-2 0-6 6m-2 0-4 4 1 1 4-4m2-10 7 7"/></svg>'
        },
        {
            id: "support",
            label: "Support",
            href: "support.html",
            icon: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-2a8 8 0 0 1 16 0v2M6 18H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h1v5Zm12 0h1a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-1v5Zm0 0c0 2-2 3-5 3"/></svg>'
        }
    ];

    const logoutIcon = '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5m5-4 4-3-4-3m4 3H9"/></svg>';

    // Build sidebar
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        const navMarkup = navItems.map(item => {
            const isActive = currentPage === item.id;
            return `
                <li class="nav-item">
                    <a class="nav-link${isActive ? " active" : ""}" href="${item.href}"${isActive ? ' aria-current="page"' : ""}>
                        ${item.icon}
                        <span>${item.label}</span>
                    </a>
                </li>`;
        }).join("");

        sidebar.innerHTML = `
            <div class="sidebar-inner">
                <a class="logo" href="dashboard.html" aria-label="Hello Solar Merchant dashboard">
                    <img src="assets/images/hello_solar.png" alt="Hello Solar">
                </a>
                <div class="portal-tag">Merchant Portal</div>
                <nav class="nav" id="nav" aria-label="Primary navigation">
                    <ul class="nav-list">${navMarkup}</ul>
                </nav>
                <div class="logout">
                    <a class="nav-link" href="login.html" id="logoutBtn">
                        ${logoutIcon}
                        <span>Logout</span>
                    </a>
                </div>
            </div>`;

        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("hello_solar_merchant_logged_in");
                sessionStorage.removeItem("hello_solar_merchant_logged_in");
            });
        }
    }

    // Highlight mobile bottom navigation items
    document.querySelectorAll(".mobile-bottom-nav-item").forEach(item => {
        const href = item.getAttribute("href") || "";
        const itemPage = href.replace(".html", "").toLowerCase();
        const isActive = currentPage === itemPage;
        item.classList.toggle("active", isActive);
        if (isActive) {
            item.setAttribute("aria-current", "page");
        } else {
            item.removeAttribute("aria-current");
        }
    });

    // --------------------------------------------------------------------------
    // 2. MOBILE DRAWER NAVIGATION & BACKDROP
    // --------------------------------------------------------------------------
    const menuBtn = document.getElementById("menu-btn");
    const backdrop = document.getElementById("backdrop");

    function setMenu(open) {
        if (!sidebar || !menuBtn || !backdrop) return;
        sidebar.classList.toggle("open", open);
        menuBtn.classList.toggle("open", open);
        backdrop.classList.toggle("open", open);
        document.body.classList.toggle("nav-open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        backdrop.setAttribute("aria-hidden", String(!open));
    }

    if (menuBtn && backdrop) {
        menuBtn.addEventListener("click", () => {
            const isOpen = sidebar.classList.contains("open");
            setMenu(!isOpen);
        });
        backdrop.addEventListener("click", () => setMenu(false));
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (sidebar && sidebar.classList.contains("open")) {
                setMenu(false);
                menuBtn.focus();
            }
            closeActiveModal();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth >= 768 && sidebar && sidebar.classList.contains("open")) {
            setMenu(false);
        }
    });

    // --------------------------------------------------------------------------
    // 3. TOAST NOTIFICATION UTILITY
    // --------------------------------------------------------------------------
    function showToast(message, duration = 3500) {
        let toast = document.getElementById("portalToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "portalToast";
            toast.className = "toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }
        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>`;
        toast.classList.add("show");
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove("show");
        }, duration);
    }

    // --------------------------------------------------------------------------
    // 4. TOPBAR PROFILE RENDERING & PROFILE MODAL
    // --------------------------------------------------------------------------
    const allDataset = await window.MerchantData.loadAllData();
    let merchantData = allDataset.merchant || {};

    function renderTopbarProfile() {
        const profileContainer = document.getElementById("topbarProfile");
        if (!profileContainer) return;

        const initials = (merchantData.contactPerson || "Marco Santos")
            .split(" ")
            .map(n => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

        profileContainer.innerHTML = `
            <div class="profile-text">
                <span class="profile-name">${merchantData.companyName || "SolarTech Manila"}</span>
                <span class="profile-role">${merchantData.accountType || "Merchant Partner"} · ${merchantData.verificationStatus || "Accreditation on File"}</span>
            </div>
            <div class="profile-avatar" title="${merchantData.contactPerson}">${initials}</div>`;

        const topbarName = document.getElementById("topbarMerchantName");
        if (topbarName) topbarName.textContent = merchantData.companyName || "SolarTech Manila";

        const bannerName = document.getElementById("bannerMerchantName");
        if (bannerName) bannerName.textContent = merchantData.companyName || "SolarTech Manila";
    }
    renderTopbarProfile();

    const profileTrigger = document.getElementById("topbarProfile");
    if (profileTrigger) {
        profileTrigger.addEventListener("click", openProfileModal);
        profileTrigger.setAttribute("tabindex", "0");
        profileTrigger.setAttribute("role", "button");
        profileTrigger.setAttribute("aria-haspopup", "dialog");
        profileTrigger.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openProfileModal();
            }
        });
    }

    function openProfileModal() {
        let modal = document.getElementById("profileModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "profileModal";
            modal.className = "modal-backdrop";
            modal.setAttribute("role", "dialog");
            modal.setAttribute("aria-modal", "true");
            modal.setAttribute("aria-labelledby", "profileModalTitle");
            document.body.appendChild(modal);
        }

        const prefs = merchantData.payoutPreferences || {};

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <div>
                        <h2 id="profileModalTitle">Merchant Profile & Settings</h2>
                        <p style="font-size:12.5px;color:var(--gray-500);margin-top:2px;">Manage merchant company details and payout bank preferences.</p>
                    </div>
                    <button class="modal-close" id="closeProfileModal" type="button" aria-label="Close dialog">✕</button>
                </div>
                <form id="profileForm">
                    <div class="modal-body">
                        <div class="detail-grid" style="margin-bottom:18px;">
                            <div class="detail-item">
                                <span class="detail-label">Merchant ID</span>
                                <span class="detail-value">${merchantData.merchantId}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Partner Tier</span>
                                <span class="detail-value" style="color:var(--solar-orange-dark);">${merchantData.partnerTier}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Commission Rate</span>
                                <span class="detail-value">${merchantData.commissionRate}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Account Manager</span>
                                <span class="detail-value">${merchantData.accountManager}</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="profCompanyName">Company Name</label>
                            <input class="form-input" id="profCompanyName" name="companyName" type="text" value="${merchantData.companyName}" required>
                        </div>
                        <div class="detail-grid">
                            <div class="form-group" style="margin-bottom:0;">
                                <label class="form-label" for="profContactPerson">Contact Person</label>
                                <input class="form-input" id="profContactPerson" name="contactPerson" type="text" value="${merchantData.contactPerson}" required>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label class="form-label" for="profPhone">Contact Phone</label>
                                <input class="form-input" id="profPhone" name="phone" type="text" value="${merchantData.phone}" required>
                            </div>
                        </div>
                        <hr style="border:none;border-top:1px solid var(--gray-200);margin:18px 0;">
                        <h3 style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px;">Payout Bank Preferences</h3>
                        <div class="detail-grid">
                            <div class="form-group" style="margin-bottom:0;">
                                <label class="form-label" for="profBank">Preferred Bank</label>
                                <select class="form-select" id="profBank" name="preferredBank">
                                    <option value="BDO Unibank"${prefs.preferredBank === "BDO Unibank" ? " selected" : ""}>BDO Unibank</option>
                                    <option value="Bank of the Philippine Islands (BPI)"${prefs.preferredBank && prefs.preferredBank.includes("BPI") ? " selected" : ""}>BPI</option>
                                    <option value="Metrobank"${prefs.preferredBank === "Metrobank" ? " selected" : ""}>Metrobank</option>
                                    <option value="UnionBank of the Philippines"${prefs.preferredBank && prefs.preferredBank.includes("UnionBank") ? " selected" : ""}>UnionBank</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label class="form-label" for="profAcctName">Account Display Name</label>
                                <input class="form-input" id="profAcctName" name="accountName" type="text" value="${prefs.accountName || ""}" required>
                            </div>
                        </div>
                        <div class="form-group" style="margin-top:14px;margin-bottom:0;">
                            <label class="form-label" for="profAcctNumber">Masked Account Number</label>
                            <input class="form-input" id="profAcctNumber" name="accountNumberMasked" type="text" value="${prefs.accountNumberMasked || "**** **** 9012"}" required>
                            <small style="color:var(--gray-500);font-size:11.5px;display:block;margin-top:4px;">Sensitive full bank account numbers are kept confidential and managed via compliance desk.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary btn-sm" id="cancelProfileBtn" type="button">Cancel</button>
                        <button class="btn btn-primary btn-sm" type="submit">Save Changes</button>
                    </div>
                </form>
            </div>`;

        modal.classList.add("open");
        document.body.classList.add("nav-open");

        modal.querySelector("#closeProfileModal").onclick = () => closeActiveModal();
        modal.querySelector("#cancelProfileBtn").onclick = () => closeActiveModal();
        modal.onclick = (e) => {
            if (e.target === modal) closeActiveModal();
        };

        modal.querySelector("#profileForm").onsubmit = (e) => {
            e.preventDefault();
            const form = e.target;
            const updated = {
                companyName: form.elements.companyName.value.trim(),
                contactPerson: form.elements.contactPerson.value.trim(),
                phone: form.elements.phone.value.trim(),
                preferredBank: form.elements.preferredBank.value,
                accountName: form.elements.accountName.value.trim(),
                accountNumberMasked: form.elements.accountNumberMasked.value.trim()
            };

            window.MerchantData.saveUserPreferences(updated);
            merchantData.companyName = updated.companyName;
            merchantData.contactPerson = updated.contactPerson;
            merchantData.phone = updated.phone;
            if (!merchantData.payoutPreferences) merchantData.payoutPreferences = {};
            merchantData.payoutPreferences.preferredBank = updated.preferredBank;
            merchantData.payoutPreferences.accountName = updated.accountName;
            merchantData.payoutPreferences.accountNumberMasked = updated.accountNumberMasked;

            renderTopbarProfile();
            closeActiveModal();
            showToast("Merchant profile & payout preferences saved successfully.");
        };
    }

    function closeActiveModal() {
        document.querySelectorAll(".modal-backdrop.open").forEach(modal => {
            modal.classList.remove("open");
        });
        document.body.classList.remove("nav-open");
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeActiveModal();
    });

    // --------------------------------------------------------------------------
    // 5. PROJECT & PAYOUT DETAIL MODALS
    // --------------------------------------------------------------------------
    window.openProjectModal = async function (projectId) {
        const project = await window.MerchantData.getProjectById(projectId);
        if (!project) return;

        let modal = document.getElementById("projectModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "projectModal";
            modal.className = "modal-backdrop";
            modal.style.zIndex = "1100";
            modal.setAttribute("role", "dialog");
            modal.setAttribute("aria-modal", "true");
            document.body.appendChild(modal);
        } else {
            modal.style.zIndex = "1100";
        }

        const crew = await window.MerchantData.getInstallerById(project.assignedCrewId);
        const crewName = crew ? `${crew.teamName} (${crew.leadEngineer})` : (project.assignedCrewId || "Unassigned");

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <div>
                        <div class="badge badge-${getStageClass(project.currentStage)}" style="margin-bottom:6px;">${project.currentStage}</div>
                        <h2>${project.customerName}</h2>
                        <p style="font-size:12.5px;color:var(--gray-500);">${project.id} · ${project.location}</p>
                    </div>
                    <button class="modal-close" onclick="document.getElementById('projectModal').classList.remove('open');document.body.classList.remove('nav-open');" type="button" aria-label="Close dialog">✕</button>
                </div>
                <div class="modal-body">
                    <div style="background:var(--cream-soft);border:1px solid rgba(255, 138, 0, 0.25);border-radius:var(--radius-xs);padding:12px 14px;margin-bottom:16px;">
                        <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:var(--solar-orange-dark);display:block;margin-bottom:2px;">Next Recorded Action</span>
                        <strong style="color:var(--navy);font-size:13.5px;">${project.nextAction || "No pending action recorded."}</strong>
                    </div>

                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">System Capacity & Type</span>
                            <span class="detail-value">${project.systemCapacity} (${project.systemType})</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Project Valuation</span>
                            <span class="detail-value">${window.MerchantData.formatCurrency(project.projectValue)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Target Completion Date</span>
                            <span class="detail-value">${project.targetDate}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Assigned Crew</span>
                            <span class="detail-value">${crewName}</span>
                        </div>
                        <div class="detail-item-full">
                            <span class="detail-label">PV Equipment & Inverter</span>
                            <span class="detail-value" style="font-size:13.5px;">${project.panelBrand} (${project.panelQuantity} panels) + ${project.inverterBrand}</span>
                        </div>
                        <div class="detail-item-full">
                            <span class="detail-label">Battery Storage Specifications</span>
                            <span class="detail-value" style="font-size:13.5px;">${project.batterySpecs}</span>
                        </div>
                        <div class="detail-item-full">
                            <span class="detail-label">Permit & Regulatory Status</span>
                            <span class="detail-value" style="font-size:13.5px;color:var(--solar-orange-dark);">${project.permitStatus}</span>
                        </div>
                        <div class="detail-item-full">
                            <span class="detail-label">Single-Line Diagram (SLD) Note</span>
                            <p style="font-size:12.5px;color:var(--gray-600);background:var(--gray-50);padding:10px;border-radius:var(--radius-xs);border:1px solid var(--gray-200);">${project.singleLineDiagramNote}</p>
                        </div>
                        <div class="detail-item-full">
                            <span class="detail-label">Installation Timeline Schedule</span>
                            <p style="font-size:12.5px;color:var(--gray-600);">${project.installationSchedule}</p>
                        </div>
                        <div class="detail-item-full">
                            <span class="detail-label">Site & Structural Observations</span>
                            <p style="font-size:12.5px;color:var(--gray-600);">${project.siteNotes}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('projectModal').classList.remove('open');document.body.classList.remove('nav-open');" type="button">Close</button>
                    <a class="btn btn-primary btn-sm" href="support.html?project=${project.id}">Inquire with Support</a>
                </div>
            </div>`;

        modal.classList.add("open");
        document.body.classList.add("nav-open");
        modal.onclick = (e) => {
            if (e.target === modal) closeActiveModal();
        };
    };

    window.openPayoutModal = async function (payoutId) {
        const payout = await window.MerchantData.getPayoutById(payoutId);
        if (!payout) return;

        let modal = document.getElementById("payoutModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "payoutModal";
            modal.className = "modal-backdrop";
            modal.style.zIndex = "1100";
            modal.setAttribute("role", "dialog");
            modal.setAttribute("aria-modal", "true");
            document.body.appendChild(modal);
        } else {
            modal.style.zIndex = "1100";
        }

        const statusClass = payout.status.toLowerCase().replace(/\s+/g, '-');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <div>
                        <div class="badge badge-${statusClass}" style="margin-bottom:6px;">${payout.status}</div>
                        <h2>${payout.payoutId}</h2>
                        <p style="font-size:12.5px;color:var(--gray-500);">${payout.projectName} (${payout.projectId})</p>
                    </div>
                    <button class="modal-close" onclick="document.getElementById('payoutModal').classList.remove('open');document.body.classList.remove('nav-open');" type="button" aria-label="Close dialog">✕</button>
                </div>
                <div class="modal-body">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Gross Sales Commission</span>
                            <span class="detail-value">${window.MerchantData.formatCurrency(payout.grossCommission)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">2% Creditable Withholding Tax (BIR CWT)</span>
                            <span class="detail-value" style="color:var(--red);">- ${window.MerchantData.formatCurrency(payout.withholdingTax)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Net Disbursement Amount</span>
                            <span class="detail-value" style="font-size:18px;color:var(--green);">${window.MerchantData.formatCurrency(payout.netDisbursement)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Release / Scheduled Date</span>
                            <span class="detail-value">${payout.releaseDate}</span>
                        </div>
                        <div class="detail-item-full">
                            <span class="detail-label">Milestone Justification</span>
                            <span class="detail-value" style="font-size:13.5px;">${payout.milestone}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Bank Destination</span>
                            <span class="detail-value" style="font-size:13px;">${payout.bankDestination}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Disbursement Confirmation Reference</span>
                            <span class="detail-value" style="font-size:13px;color:var(--navy);font-weight:700;">${payout.bankConfirmation}</span>
                        </div>
                        <div class="detail-item-full">
                            <span class="detail-label">Audit & Clearance Notes</span>
                            <p style="font-size:12.5px;color:var(--gray-600);background:var(--gray-50);padding:10px;border-radius:var(--radius-xs);border:1px solid var(--gray-200);">${payout.auditNotes}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('payoutModal').classList.remove('open');document.body.classList.remove('nav-open');" type="button">Close</button>
                    <a class="btn btn-primary btn-sm" href="support.html?payout=${payout.payoutId}">Ask About This Payout</a>
                </div>
            </div>`;

        modal.classList.add("open");
        document.body.classList.add("nav-open");
        modal.onclick = (e) => {
            if (e.target === modal) closeActiveModal();
        };
    };

    function getStageClass(stage) {
        if (!stage) return "in-progress";
        const s = stage.toLowerCase();
        if (s.includes("completed")) return "completed";
        if (s.includes("structural")) return "structural-mounting";
        if (s.includes("survey")) return "site-survey";
        if (s.includes("engineering")) return "engineering-approval";
        if (s.includes("permit")) return "permitting";
        if (s.includes("testing")) return "testing";
        return "in-progress";
    }

    // --------------------------------------------------------------------------
    // 6. PAGE 1: DASHBOARD (dashboard.html)
    // --------------------------------------------------------------------------
    if (currentPage === "dashboard") {
        const dataset = await window.MerchantData.loadAllData();
        const summary = window.MerchantData.calculateSummary(dataset);
        const projects = dataset.projects || [];
        const crews = dataset.crews || [];

        // Dynamic KPI updates
        const kpiInstalls = document.getElementById("kpiActiveInstalls");
        if (kpiInstalls) kpiInstalls.textContent = summary.activeInstallsCount ?? "—";

        const kpiPortfolio = document.getElementById("kpiPortfolioValue");
        if (kpiPortfolio) kpiPortfolio.textContent = window.MerchantData.formatCurrency(summary.portfolioValuePhp);

        const kpiPending = document.getElementById("kpiPendingPayouts");
        if (kpiPending) kpiPending.textContent = window.MerchantData.formatCurrency(summary.pendingPayoutsPhp);

        const kpiCrews = document.getElementById("kpiActiveCrews");
        if (kpiCrews) kpiCrews.textContent = summary.activeCrewsCount ?? "3";

        // Render Active Projects Table with Search, Filter & See More/Less
        let projectsExpanded = false;
        const DEFAULT_PROJECT_LIMIT = 4;
        const searchInput = document.getElementById("projectSearch");
        const stageFilter = document.getElementById("projectStageFilter");
        const tableBody = document.getElementById("projectsTableBody");
        const projectsToggleBtn = document.getElementById("projectsToggleBtn");

        function renderProjects() {
            if (!tableBody) return;
            const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
            const stage = stageFilter ? stageFilter.value : "All";

            const filtered = projects.filter(p => {
                const textMatch = !query ||
                    p.id.toLowerCase().includes(query) ||
                    p.customerName.toLowerCase().includes(query) ||
                    p.location.toLowerCase().includes(query) ||
                    p.systemCapacity.toLowerCase().includes(query) ||
                    (p.nextAction && p.nextAction.toLowerCase().includes(query));

                const stageMatch = stage === "All" ||
                    (stage === "In Progress" && p.progress < 100) ||
                    (stage === "Completed" && p.progress === 100) ||
                    p.currentStage === stage;

                return textMatch && stageMatch;
            });

            const seeMoreWrap = document.getElementById("projectsSeeMoreWrap");
            const toggleBtn = document.getElementById("projectsToggleBtn");
            const toggleText = document.getElementById("projectsToggleText");

            if (!filtered.length) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            <div class="state-empty">
                                <svg class="state-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <h3>No projects matched</h3>
                                <p>Try clearing your search query or adjusting the stage filter.</p>
                            </div>
                        </td>
                    </tr>`;
                if (seeMoreWrap) seeMoreWrap.style.display = "none";
                return;
            }

            const isFiltered = query !== "" || stage !== "All";
            const displayList = (projectsExpanded || isFiltered) ? filtered : filtered.slice(0, DEFAULT_PROJECT_LIMIT);

            tableBody.innerHTML = displayList.map(p => {
                const stageClass = getStageClass(p.currentStage);
                const assignedCrew = crews.find(c => c.crewId === p.assignedCrewId);
                const crewLabel = assignedCrew ? assignedCrew.teamName : (p.assignedCrewId || "Unassigned");
                const nextActionText = p.nextAction || "Verify next milestone milestone with crew lead";

                return `
                    <tr>
                        <td data-label="Project & Customer">
                            <div class="td-strong">${p.customerName}</div>
                            <div class="td-sub">${p.id} · ${p.location}</div>
                        </td>
                        <td data-label="Package & Capacity">
                            <div class="td-strong">${p.systemCapacity}</div>
                            <div class="td-sub">${p.systemType}</div>
                        </td>
                        <td data-label="Assigned Crew">
                            <span class="td-strong" style="font-size:13px;color:var(--navy);">${crewLabel}</span>
                        </td>
                        <td data-label="Stage">
                            <span class="badge badge-${stageClass}">
                                <span class="dot"></span>
                                ${p.currentStage}
                            </span>
                        </td>
                        <td data-label="Next Action">
                            <span style="font-size:12.5px;color:var(--gray-700);line-height:1.4;display:inline-block;max-width:280px;">${nextActionText}</span>
                        </td>
                        <td data-label="Action">
                            <button class="btn btn-secondary btn-sm" onclick="openProjectModal('${p.id}')" type="button">
                                View Project
                            </button>
                        </td>
                    </tr>`;
            }).join("");

            if (seeMoreWrap && toggleBtn && toggleText) {
                if (filtered.length > DEFAULT_PROJECT_LIMIT && !isFiltered) {
                    seeMoreWrap.style.display = "flex";
                    if (projectsExpanded) {
                        toggleText.textContent = "See Less";
                        toggleBtn.classList.add("expanded");
                        toggleBtn.setAttribute("aria-expanded", "true");
                    } else {
                        const remaining = filtered.length - DEFAULT_PROJECT_LIMIT;
                        toggleText.textContent = `See More (${remaining} more projects)`;
                        toggleBtn.classList.remove("expanded");
                        toggleBtn.setAttribute("aria-expanded", "false");
                    }
                } else {
                    seeMoreWrap.style.display = "none";
                }
            }
        }

        if (projectsToggleBtn) {
            projectsToggleBtn.addEventListener("click", () => {
                projectsExpanded = !projectsExpanded;
                renderProjects();
            });
        }

        if (searchInput) searchInput.addEventListener("input", renderProjects);
        if (stageFilter) stageFilter.addEventListener("change", renderProjects);
        renderProjects();

        // Render Milestones (Top 3 Upcoming on Dashboard + Modal Timeline)
        const milestones = dataset.milestones || [];
        const milestonesContainer = document.getElementById("milestonesList");
        const viewAllMilestonesBtn = document.getElementById("viewAllMilestonesBtn");
        const allMilestonesModal = document.getElementById("allMilestonesModal");
        const closeMilestonesModalBtn = document.getElementById("closeMilestonesModalBtn");
        const closeMilestonesModalFooterBtn = document.getElementById("closeMilestonesModalFooterBtn");
        const allMilestonesList = document.getElementById("allMilestonesList");

        function getMilestoneBadgeClass(status) {
            if (!status) return "in-progress";
            const s = status.toLowerCase();
            if (s.includes("completed") || s.includes("released") || s.includes("done")) return "completed";
            if (s.includes("process")) return "processing";
            if (s.includes("pending")) return "pending-review";
            if (s.includes("sched")) return "in-progress";
            return "in-progress";
        }

        // Sort milestones chronologically (nearest upcoming first)
        const sortedMilestones = [...milestones].sort((a, b) => {
            const da = new Date(a.date);
            const db = new Date(b.date);
            if (isNaN(da.getTime())) return 1;
            if (isNaN(db.getTime())) return -1;
            return da - db;
        });

        function buildMilestoneItemHtml(m) {
            const parts = (m.date || "").split(" ");
            const month = parts[0] || "Sept";
            const day = (parts[1] || "").replace(",", "");
            const badgeClass = getMilestoneBadgeClass(m.status);
            return `
                <div class="milestone-item">
                    <div class="milestone-main">
                        <div class="milestone-date">
                            ${month}
                            <span>${day}</span>
                        </div>
                        <div class="milestone-info">
                            <div class="milestone-title">${m.title}</div>
                            <div class="milestone-project-line">
                                <span>${m.projectName || m.projectId}</span>
                                <span class="badge badge-${badgeClass}" style="font-size:10.5px;padding:2px 7px;">${m.status}</span>
                            </div>
                        </div>
                    </div>
                    <div class="milestone-action-btn">
                        <button class="btn btn-secondary btn-sm" onclick="openProjectModal('${m.projectId}')" type="button">
                            View Project →
                        </button>
                    </div>
                </div>`;
        }

        function renderMilestones() {
            if (!milestonesContainer) return;
            const topMilestones = sortedMilestones.slice(0, 3);
            if (topMilestones.length === 0) {
                milestonesContainer.innerHTML = `
                    <div class="state-empty" style="padding:24px 16px;">
                        <p>No upcoming milestones scheduled.</p>
                    </div>`;
                return;
            }
            milestonesContainer.innerHTML = topMilestones.map(buildMilestoneItemHtml).join("");
        }

        function openAllMilestonesModal() {
            if (!allMilestonesModal || !allMilestonesList) return;
            if (sortedMilestones.length === 0) {
                allMilestonesList.innerHTML = `
                    <div class="state-empty" style="padding:32px 16px;">
                        <p>No milestones recorded in the current dataset.</p>
                    </div>`;
            } else {
                allMilestonesList.innerHTML = sortedMilestones.map(buildMilestoneItemHtml).join("");
            }
            allMilestonesModal.classList.add("open");
            document.body.classList.add("nav-open");
        }

        function closeAllMilestonesModal() {
            if (allMilestonesModal) allMilestonesModal.classList.remove("open");
            document.body.classList.remove("nav-open");
        }

        if (viewAllMilestonesBtn) {
            viewAllMilestonesBtn.addEventListener("click", openAllMilestonesModal);
        }
        if (closeMilestonesModalBtn) {
            closeMilestonesModalBtn.addEventListener("click", closeAllMilestonesModal);
        }
        if (closeMilestonesModalFooterBtn) {
            closeMilestonesModalFooterBtn.addEventListener("click", closeAllMilestonesModal);
        }
        if (allMilestonesModal) {
            allMilestonesModal.addEventListener("click", (e) => {
                if (e.target === allMilestonesModal) closeAllMilestonesModal();
            });
        }

        renderMilestones();

        // Render Operational Activity Logs (Top 4 on Dashboard + Full Audit History Modal)
        const activities = dataset.activity || [];
        const activityContainer = document.getElementById("activityFeed");
        const viewAllActivityBtn = document.getElementById("viewAllActivityBtn");
        const allActivityModal = document.getElementById("allActivityModal");
        const closeActivityModalBtn = document.getElementById("closeActivityModalBtn");
        const closeActivityModalFooterBtn = document.getElementById("closeActivityModalFooterBtn");
        const allActivityFeed = document.getElementById("allActivityFeed");

        function buildActivityItemHtml(a) {
            const projectTag = a.projectName || a.projectId ? `<span class="activity-project-tag">${a.projectName || a.projectId}</span>` : "";
            const projectBtn = a.projectId ? `
                <div class="activity-action-btn">
                    <button class="btn btn-secondary btn-sm" onclick="openProjectModal('${a.projectId}')" type="button">
                        View Project →
                    </button>
                </div>` : "";

            return `
                <div class="activity-item">
                    <div class="activity-main">
                        <div class="activity-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                        </div>
                        <div class="activity-content">
                            <div class="activity-header">
                                <strong>${a.title}</strong>
                                ${projectTag}
                            </div>
                            <div class="activity-detail">${a.detail}</div>
                            <div class="activity-meta">
                                <span>${a.timestamp}</span>
                                ${a.crewName ? `· <span>${a.crewName}</span>` : ""}
                            </div>
                        </div>
                    </div>
                    ${projectBtn}
                </div>`;
        }

        function renderActivity() {
            if (!activityContainer) return;
            const topActivities = activities.slice(0, 4);
            if (topActivities.length === 0) {
                activityContainer.innerHTML = `
                    <div class="state-empty" style="padding:24px 16px;">
                        <p>No recent operational activities recorded.</p>
                    </div>`;
                return;
            }
            activityContainer.innerHTML = topActivities.map(buildActivityItemHtml).join("");
        }

        function openAllActivityModal() {
            if (!allActivityModal || !allActivityFeed) return;
            if (activities.length === 0) {
                allActivityFeed.innerHTML = `
                    <div class="state-empty" style="padding:32px 16px;">
                        <p>No activity logs recorded in the current dataset.</p>
                    </div>`;
            } else {
                allActivityFeed.innerHTML = activities.map(buildActivityItemHtml).join("");
            }
            allActivityModal.classList.add("open");
            document.body.classList.add("nav-open");
        }

        function closeAllActivityModal() {
            if (allActivityModal) allActivityModal.classList.remove("open");
            document.body.classList.remove("nav-open");
        }

        if (viewAllActivityBtn) {
            viewAllActivityBtn.addEventListener("click", openAllActivityModal);
        }
        if (closeActivityModalBtn) {
            closeActivityModalBtn.addEventListener("click", closeAllActivityModal);
        }
        if (closeActivityModalFooterBtn) {
            closeActivityModalFooterBtn.addEventListener("click", closeAllActivityModal);
        }
        if (allActivityModal) {
            allActivityModal.addEventListener("click", (e) => {
                if (e.target === allActivityModal) closeAllActivityModal();
            });
        }

        renderActivity();
    }

    // --------------------------------------------------------------------------
    // 7. PAGE 2: PAYMENTS (payments.html)
    // --------------------------------------------------------------------------
    if (currentPage === "payments") {
        const dataset = await window.MerchantData.loadAllData();
        const summary = window.MerchantData.calculateSummary(dataset);
        const payouts = dataset.payouts || [];

        const totalPaidEl = document.getElementById("payTotalPaid");
        if (totalPaidEl) totalPaidEl.textContent = window.MerchantData.formatCurrency(summary.totalPaidPhp);

        const pendingEl = document.getElementById("payPendingReview");
        if (pendingEl) pendingEl.textContent = window.MerchantData.formatCurrency(summary.pendingPayoutsPhp);

        const onHoldEl = document.getElementById("payOnHold");
        if (onHoldEl) onHoldEl.textContent = window.MerchantData.formatCurrency(summary.onHoldPayoutsPhp);

        const nextReleaseEl = document.getElementById("payNextRelease");
        if (nextReleaseEl) nextReleaseEl.textContent = summary.nextReleaseDate || "Sept 15, 2026";

        const searchInput = document.getElementById("payoutSearch");
        const statusFilter = document.getElementById("payoutStatusFilter");
        const tableBody = document.getElementById("payoutsTableBody");
        const exportBtn = document.getElementById("exportCsvBtn");

        let currentFilteredPayouts = [...payouts];

        function renderPayouts() {
            if (!tableBody) return;
            const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
            const status = statusFilter ? statusFilter.value : "All";

            currentFilteredPayouts = payouts.filter(p => {
                const textMatch = !query ||
                    p.payoutId.toLowerCase().includes(query) ||
                    p.projectId.toLowerCase().includes(query) ||
                    p.projectName.toLowerCase().includes(query) ||
                    p.milestone.toLowerCase().includes(query);

                const statusMatch = status === "All" || p.status === status;

                return textMatch && statusMatch;
            });

            if (!currentFilteredPayouts.length) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="state-empty">
                                <svg class="state-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <rect x="3" y="5" width="18" height="14" rx="3"></rect>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <h3>No payouts found</h3>
                                <p>Try adjusting your search query or status filter.</p>
                            </div>
                        </td>
                    </tr>`;
                if (exportBtn) exportBtn.disabled = true;
                return;
            }

            if (exportBtn) exportBtn.disabled = false;

            tableBody.innerHTML = currentFilteredPayouts.map(p => {
                const statusClass = p.status.toLowerCase().replace(/\s+/g, "-");
                return `
                    <tr>
                        <td data-label="Reference">
                            <div class="td-strong">${p.payoutId}</div>
                        </td>
                        <td data-label="Related Project">
                            <div class="td-strong">${p.projectName}</div>
                            <div class="td-sub">${p.projectId}</div>
                        </td>
                        <td data-label="Milestone / Purpose">
                            <div style="font-size:13px;color:var(--navy);max-width:280px;line-height:1.35;">${p.milestone}</div>
                        </td>
                        <td data-label="Net Payout">
                            <strong style="color:var(--green);font-size:14.5px;">${window.MerchantData.formatCurrency(p.netDisbursement)}</strong>
                        </td>
                        <td data-label="Status">
                            <span class="badge badge-${statusClass}">
                                <span class="dot"></span>
                                ${p.status}
                            </span>
                        </td>
                        <td data-label="Paid / Expected Date">
                            <span style="font-size:12.5px;color:var(--gray-600);">${p.releaseDate}</span>
                        </td>
                        <td data-label="Action">
                            <button class="btn btn-secondary btn-sm" onclick="openPayoutModal('${p.payoutId}')" type="button">
                                View Payout
                            </button>
                        </td>
                    </tr>`;
            }).join("");
        }

        if (searchInput) searchInput.addEventListener("input", renderPayouts);
        if (statusFilter) statusFilter.addEventListener("change", renderPayouts);
        renderPayouts();

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                const exportData = currentFilteredPayouts.map(p => ({
                    PayoutReference: p.payoutId,
                    ProjectID: p.projectId,
                    ProjectName: p.projectName,
                    Milestone: p.milestone,
                    GrossCommissionPHP: p.grossCommission,
                    WithholdingTax2PctPHP: p.withholdingTax,
                    NetDisbursementPHP: p.netDisbursement,
                    Status: p.status,
                    ReleaseOrExpectedDate: p.releaseDate,
                    BankDestination: p.bankDestination,
                    BankConfirmation: p.bankConfirmation,
                    AuditNotes: p.auditNotes
                }));
                window.MerchantData.downloadCSV(exportData, `hello-solar-merchant-payouts-${new Date().toISOString().slice(0, 10)}.csv`);
                showToast("Filtered payouts exported as CSV successfully.");
            });
        }
    }

    // --------------------------------------------------------------------------
    // 8. PAGE 3: INSTALLERS (installers.html)
    // --------------------------------------------------------------------------
    if (currentPage === "installers") {
        const dataset = await window.MerchantData.loadAllData();
        const installers = dataset.crews || [];
        const projects = dataset.projects || [];

        // Render Installer Team Cards
        const teamsContainer = document.getElementById("installerTeamsGrid");
        if (teamsContainer) {
            teamsContainer.innerHTML = installers.map(c => {
                const assignedProjects = projects.filter(p => p.assignedCrewId === c.crewId);
                const activeCount = assignedProjects.filter(p => p.progress < 100).length;

                return `
                    <div class="crew-card">
                        <div>
                            <div class="crew-header">
                                <div class="crew-title-wrap">
                                    <div class="crew-avatar">${c.teamName.replace("Team ", "")[0]}</div>
                                    <div>
                                        <div class="crew-name">${c.teamName}</div>
                                        <div class="crew-lead">${c.leadEngineer}</div>
                                    </div>
                                </div>
                                <span class="badge badge-${c.availability.includes('Active') ? 'in-progress' : 'completed'}">${c.availability}</span>
                            </div>
                            <div class="crew-specs">
                                <div class="crew-spec-row">
                                    <span>Specialist Technicians</span>
                                    <strong>${c.technicianHeadcount} Personnel</strong>
                                </div>
                                <div class="crew-spec-row">
                                    <span>Active Projects Count</span>
                                    <strong style="color:var(--solar-orange-dark);">${activeCount} Active Sites</strong>
                                </div>
                                <div class="crew-spec-row">
                                    <span>Assigned Sites & Stages</span>
                                    <span style="font-size:12px;font-weight:600;color:var(--navy);text-align:right;">
                                        ${assignedProjects.map(p => `${p.id} (${p.currentStage})`).join("<br>") || "No active sites"}
                                    </span>
                                </div>
                                <div class="crew-spec-row">
                                    <span>Safety Compliance Audit</span>
                                    <strong style="color:var(--green);">${c.safetyCompliance || "Verified"}</strong>
                                </div>
                                <div class="crew-spec-row">
                                    <span>Engineering Focus</span>
                                    <span style="font-size:12px;font-weight:600;color:var(--navy);">${c.specialization}</span>
                                </div>
                            </div>
                            <div class="crew-certs">
                                ${(c.certifications || []).map(cert => `<span class="cert-pill">${cert}</span>`).join("")}
                            </div>
                        </div>
                        <div class="crew-footer">
                            <span class="crew-vehicle">${c.vehiclesAssigned}</span>
                            <a href="tel:${(c.contact || '').split(" · ")[0]}" class="crew-call-link">Direct Call →</a>
                        </div>
                    </div>`;
            }).join("");
        }

        // Installation Tracker Table
        const searchInput = document.getElementById("installerSearch");
        const crewFilter = document.getElementById("crewFilter");
        const stageFilter = document.getElementById("stageFilter");
        const tableBody = document.getElementById("installationsTableBody");

        function renderInstallations() {
            if (!tableBody) return;
            const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
            const selCrew = crewFilter ? crewFilter.value : "All";
            const selStage = stageFilter ? stageFilter.value : "All";

            const filtered = projects.filter(p => {
                const textMatch = !query ||
                    p.id.toLowerCase().includes(query) ||
                    p.customerName.toLowerCase().includes(query) ||
                    p.location.toLowerCase().includes(query) ||
                    p.systemCapacity.toLowerCase().includes(query);

                const crewMatch = selCrew === "All" ||
                    (selCrew === "Unassigned" && (!p.assignedCrewId || p.assignedCrewId === "Unassigned")) ||
                    p.assignedCrewId === selCrew;

                const stageMatch = selStage === "All" || p.currentStage === selStage;

                return textMatch && crewMatch && stageMatch;
            });

            if (!filtered.length) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="state-empty">
                                <svg class="state-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <path d="M14.5 6.5l3-3 3 3-3 3m-2 0l-6 6m-2 0l-4 4 1 1 4-4m2-10l7 7"></path>
                                </svg>
                                <h3>No installations found</h3>
                                <p>Try clearing filters or changing the assigned crew selector.</p>
                            </div>
                        </td>
                    </tr>`;
                return;
            }

            tableBody.innerHTML = filtered.map(p => {
                const stageClass = getStageClass(p.currentStage);
                const assignedCrew = installers.find(c => c.crewId === p.assignedCrewId);
                const crewName = assignedCrew ? assignedCrew.teamName : (p.assignedCrewId || "Unassigned");

                return `
                    <tr>
                        <td data-label="Customer & ID">
                            <div class="td-strong">${p.customerName}</div>
                            <div class="td-sub">${p.id}</div>
                        </td>
                        <td data-label="Site Location">${p.location}</td>
                        <td data-label="Capacity & Type">
                            <div class="td-strong">${p.systemCapacity}</div>
                            <div class="td-sub">${p.systemType}</div>
                        </td>
                        <td data-label="Assigned Crew">
                            <span class="td-strong" style="color:var(--navy);font-size:13px;">${crewName}</span>
                        </td>
                        <td data-label="Stage">
                            <span class="badge badge-${stageClass}">
                                <span class="dot"></span>
                                ${p.currentStage}
                            </span>
                        </td>
                        <td data-label="Next Action">
                            <span style="font-size:12.5px;color:var(--gray-700);line-height:1.4;">${p.nextAction || "Confirm stage completion"}</span>
                        </td>
                        <td data-label="Action">
                            <button class="btn btn-secondary btn-sm" onclick="openProjectModal('${p.id}')" type="button">
                                View Project
                            </button>
                        </td>
                    </tr>`;
            }).join("");
        }

        if (searchInput) searchInput.addEventListener("input", renderInstallations);
        if (crewFilter) crewFilter.addEventListener("change", renderInstallations);
        if (stageFilter) stageFilter.addEventListener("change", renderInstallations);
        renderInstallations();
    }

    // --------------------------------------------------------------------------
    // 9. PAGE 4: SUPPORT (support.html)
    // --------------------------------------------------------------------------
    if (currentPage === "support") {
        const dataset = await window.MerchantData.loadAllData();
        const faqs = (dataset.support && dataset.support.faqs) ? dataset.support.faqs : [];
        const form = document.getElementById("supportTicketForm");
        const DRAFT_KEY = "hello_solar_merchant_support_draft";

        // Load existing draft
        let existingDraft = {};
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) existingDraft = JSON.parse(raw);
        } catch (e) {}

        if (form) {
            if (existingDraft.topic) form.elements.topic.value = existingDraft.topic;
            if (existingDraft.projectRef) form.elements.projectRef.value = existingDraft.projectRef;
            if (existingDraft.priority) form.elements.priority.value = existingDraft.priority;
            if (existingDraft.subject) form.elements.subject.value = existingDraft.subject;
            if (existingDraft.description) form.elements.description.value = existingDraft.description;

            // Safe prefill check: if URL has ?project=... or ?payout=...
            const urlParams = new URLSearchParams(window.location.search);
            const incomingRef = urlParams.get("project") || urlParams.get("reference") || urlParams.get("payout");
            const incomingTopic = urlParams.get("topic");

            if (incomingRef) {
                const hasExistingText = Boolean((form.elements.subject.value && form.elements.subject.value.trim()) ||
                                               (form.elements.description.value && form.elements.description.value.trim()));

                if (!hasExistingText && !form.elements.projectRef.value) {
                    // Safe to populate immediately
                    form.elements.projectRef.value = incomingRef;
                    if (incomingTopic) form.elements.topic.value = incomingTopic;
                    else if (incomingRef.startsWith("PAY-")) form.elements.topic.value = "Payout and Billing";
                } else if (form.elements.projectRef.value !== incomingRef) {
                    // Show non-destructive notification banner
                    const banner = document.getElementById("incomingContextNotice");
                    const bannerText = document.getElementById("incomingContextText");
                    const applyBtn = document.getElementById("applyContextBtn");
                    if (banner && bannerText && applyBtn) {
                        bannerText.textContent = `Incoming reference from link: "${incomingRef}". Apply without overwriting your draft text?`;
                        banner.style.display = "block";
                        applyBtn.onclick = () => {
                            form.elements.projectRef.value = incomingRef;
                            if (incomingRef.startsWith("PAY-")) form.elements.topic.value = "Payout and Billing";
                            banner.style.display = "none";
                            showToast(`Reference ${incomingRef} applied to support request.`);
                        };
                    }
                }
            }

            // Auto-save on every keystroke
            const autoSave = () => {
                const draftObj = {
                    topic: form.elements.topic.value,
                    projectRef: form.elements.projectRef.value.trim(),
                    priority: form.elements.priority.value,
                    subject: form.elements.subject.value.trim(),
                    description: form.elements.description.value.trim(),
                    lastUpdated: new Date().toISOString()
                };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draftObj));
                const statusMsg = document.getElementById("draftStatusMessage");
                if (statusMsg) statusMsg.textContent = "Draft preserved locally";
            };

            form.addEventListener("input", autoSave);
            form.addEventListener("change", autoSave);
        }

        const saveDraftBtn = document.getElementById("saveDraftBtn");
        if (saveDraftBtn && form) {
            saveDraftBtn.addEventListener("click", () => {
                const draftObj = {
                    topic: form.elements.topic.value,
                    projectRef: form.elements.projectRef.value.trim(),
                    priority: form.elements.priority.value,
                    subject: form.elements.subject.value.trim(),
                    description: form.elements.description.value.trim(),
                    lastUpdated: new Date().toISOString()
                };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draftObj));
                showToast("Support draft saved on this device.");
            });
        }

        const clearDraftBtn = document.getElementById("clearDraftBtn");
        if (clearDraftBtn && form) {
            clearDraftBtn.addEventListener("click", () => {
                localStorage.removeItem(DRAFT_KEY);
                form.reset();
                const statusMsg = document.getElementById("draftStatusMessage");
                if (statusMsg) statusMsg.textContent = "";
                showToast("Support ticket draft cleared.");
            });
        }

        const downloadDraftBtn = document.getElementById("downloadDraftBtn");
        if (downloadDraftBtn && form) {
            downloadDraftBtn.addEventListener("click", () => {
                if (!form.reportValidity()) return;

                const content = [
                    "===========================================================",
                    "HELLO SOLAR MERCHANT — OFFICIAL SUPPORT REQUEST",
                    "===========================================================",
                    `Date Generated:     ${new Date().toLocaleString("en-PH")}`,
                    `Merchant Company:   ${merchantData.companyName || "SolarTech Manila"} (ID: ${merchantData.merchantId || "MCH-77412"})`,
                    `Contact Person:     ${merchantData.contactPerson} (${merchantData.phone})`,
                    "-----------------------------------------------------------",
                    `Category / Topic:   ${form.elements.topic.value}`,
                    `Priority Level:     ${form.elements.priority.value.toUpperCase()}`,
                    `Reference ID:       ${form.elements.projectRef.value.trim() || "General Partner Account Inquiry"}`,
                    `Subject:            ${form.elements.subject.value.trim()}`,
                    "-----------------------------------------------------------",
                    "PROBLEM DESCRIPTION & DETAILS:",
                    form.elements.description.value.trim(),
                    "===========================================================",
                    "NOTICE: Unsent draft. Submit this official text request file to",
                    "Hello Solar Account Manager: David Ramos (support@hellosolar.ph)"
                ].join("\r\n");

                const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `hello-solar-merchant-request-${merchantData.merchantId || 'MCH'}-${Date.now().toString().slice(-4)}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                showToast("Official Support Request text file downloaded.");
            });
        }

        // Support Category Quick Filter Cards
        const catCards = document.querySelectorAll(".support-category-card");
        catCards.forEach(card => {
            card.addEventListener("click", () => {
                const cat = card.dataset.category;
                catCards.forEach(c => c.classList.remove("active"));
                card.classList.add("active");

                const faqCatSelect = document.getElementById("faqCategoryFilter");
                if (faqCatSelect) {
                    faqCatSelect.value = cat;
                    renderFaqs();
                }

                if (form && form.elements.topic) {
                    if (cat.includes("Payout")) form.elements.topic.value = "Payout and Billing";
                    if (cat.includes("Technical")) form.elements.topic.value = "Technical Requirements";
                    if (cat.includes("Warranty")) form.elements.topic.value = "Warranty and RMA";
                    if (cat.includes("Net-Metering")) form.elements.topic.value = "Net-Metering";
                }
            });
        });

        // FAQ Accordion & Live Keyword Search
        const faqSearchInput = document.getElementById("faqSearch");
        const faqCatSelect = document.getElementById("faqCategoryFilter");
        const faqContainer = document.getElementById("faqList");

        function renderFaqs() {
            if (!faqContainer) return;
            const query = faqSearchInput ? faqSearchInput.value.toLowerCase().trim() : "";
            const selCat = faqCatSelect ? faqCatSelect.value : "All";

            const filtered = faqs.filter(f => {
                const catMatch = selCat === "All" || f.category === selCat;
                const textMatch = !query ||
                    f.question.toLowerCase().includes(query) ||
                    f.answer.toLowerCase().includes(query) ||
                    (f.keywords && f.keywords.some(k => k.toLowerCase().includes(query)));
                return catMatch && textMatch;
            });

            if (!filtered.length) {
                faqContainer.innerHTML = `
                    <div class="state-empty" style="padding:32px 16px;">
                        <svg class="state-empty-icon" style="width:36px;height:36px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3 style="font-size:15px;">No answers found</h3>
                        <p style="font-size:12.5px;">Try searching for terms like "payout", "BIR", "Meralco", "warranty", or "inverter".</p>
                    </div>`;
                return;
            }

            faqContainer.innerHTML = filtered.map(f => `
                <div class="faq-item" id="faqItem-${f.id}">
                    <button class="faq-header" type="button" aria-expanded="false" aria-controls="faqBody-${f.id}">
                        <span>${f.question}</span>
                        <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <div class="faq-body" id="faqBody-${f.id}">
                        <p>${f.answer}</p>
                        <span class="badge badge-site-survey" style="font-size:10.5px;margin-top:10px;">${f.category}</span>
                    </div>
                </div>`).join("");

            faqContainer.querySelectorAll(".faq-header").forEach(btn => {
                btn.addEventListener("click", () => {
                    const item = btn.closest(".faq-item");
                    const isOpen = item.classList.contains("open");

                    faqContainer.querySelectorAll(".faq-item").forEach(other => {
                        other.classList.remove("open");
                        const otherBtn = other.querySelector(".faq-header");
                        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
                    });

                    if (!isOpen) {
                        item.classList.add("open");
                        btn.setAttribute("aria-expanded", "true");
                    }
                });
            });
        }

        if (faqSearchInput) faqSearchInput.addEventListener("input", renderFaqs);
        if (faqCatSelect) faqCatSelect.addEventListener("change", renderFaqs);
        renderFaqs();
    }

    // --------------------------------------------------------------------------
    // 10. LOCAL PREVIEW DATA LOADER ACCORDION (All Pages)
    // --------------------------------------------------------------------------
    const previewAccordion = document.getElementById("previewDataAccordion");
    if (previewAccordion) {
        const fileInput = document.getElementById("previewFileInput");
        const loadBtn = document.getElementById("loadCurrentJsonBtn");
        const applyBtn = document.getElementById("applyPreviewJsonBtn");
        const resetBtn = document.getElementById("resetPreviewJsonBtn");
        const textarea = document.getElementById("previewJsonTextarea");
        const statusEl = document.getElementById("previewStatus");

        if (loadBtn && textarea) {
            loadBtn.addEventListener("click", async () => {
                const currentData = await window.MerchantData.loadAllData();
                textarea.value = JSON.stringify(currentData, null, 2);
                showToast("Loaded active dataset to editor.");
            });
        }

        if (fileInput && textarea) {
            fileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    textarea.value = evt.target.result;
                    showToast(`Loaded ${file.name} to editor.`);
                };
                reader.readAsText(file);
            });
        }

        if (applyBtn && textarea && statusEl) {
            applyBtn.addEventListener("click", () => {
                const raw = textarea.value.trim();
                if (!raw) {
                    statusEl.className = "preview-data-status error";
                    statusEl.textContent = "Please paste or load JSON before applying.";
                    return;
                }

                const res = window.MerchantData.applyCustomDataset(raw);
                if (res.success) {
                    statusEl.className = "preview-data-status success";
                    statusEl.textContent = "✓ Schema validated successfully! Dataset applied. Reloading view in 1 second...";
                    setTimeout(() => window.location.reload(), 900);
                } else {
                    statusEl.className = "preview-data-status error";
                    statusEl.textContent = "Validation Errors:\n• " + res.errors.join("\n• ");
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                if (confirm("Reset to the default merchant dataset and clear local overrides?")) {
                    window.MerchantData.resetDefaultDataset();
                    showToast("Restored default dataset.");
                    setTimeout(() => window.location.reload(), 500);
                }
            });
        }
    }

    // --------------------------------------------------------------------------
    // 11. DEEP-LINKING ROUTER (?project=... or ?payout=...)
    // --------------------------------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const linkedProject = urlParams.get("project");
    const linkedPayout = urlParams.get("payout");

    if (linkedProject && typeof window.openProjectModal === "function") {
        setTimeout(() => window.openProjectModal(linkedProject), 250);
    } else if (linkedPayout && typeof window.openPayoutModal === "function") {
        setTimeout(() => window.openPayoutModal(linkedPayout), 250);
    }
});
