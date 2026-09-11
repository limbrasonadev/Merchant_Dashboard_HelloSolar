# Merchant Workspace Data Reference (`merchant.json`)

This document details the schema, allowed values, referential relationships, and reload workflow for `assets/data/merchant.json`, the authoritative data source for the **Hello Solar Merchant Portal**.

---

## 1. Overview & File Location

- **File Path**: `assets/data/merchant.json`
- **Format**: Standard UTF-8 JSON
- **Role**: Authoritative data source for projects, merchant commission payouts, installer crews, upcoming milestones, FAQs, and field activity logs.
- **Dynamic Aggregations**: KPI summary metrics (active installations, portfolio valuation, total paid, pending payouts, on-hold amounts, active crews) are **dynamically computed** in JavaScript from the records—never manually hardcoded.

---

## 2. Schema Structure & Sections

### 2.1 `merchant` (Object)
Merchant partner account profile and payment preferences.

| Field | Type | Description / Allowed Values | Example |
|---|---|---|---|
| `companyName` | string | Registered merchant business name | `"SolarTech Manila"` |
| `merchantId` | string | Unique merchant partner reference | `"MCH-77412"` |
| `accountType` | string | Role descriptor | `"Merchant Partner"` |
| `verificationStatus` | string | Honest accreditation status label | `"Accreditation on File"` |
| `contactPerson` | string | Primary account representative | `"Marco Santos"` |
| `email` | string | Official business contact email | `"merchant@hellosolar.ph"` |
| `phone` | string | Primary contact telephone/mobile | `"+63 917 888 2026"` |
| `partnerTier` | string | Partnership tier | `"Gold Certified Partner"` |
| `commissionRate` | string | Approved commission schedule | `"5.2% Tier A Commission"` |
| `accountManager` | string | Assigned Hello Solar representative | `"David Ramos"` |
| `payoutPreferences` | object | Bank destination details (masked) | `{"preferredBank": "BDO Unibank", ...}` |

> [!NOTE]
> Sensitive full bank account numbers and passwords are **never stored** in public JSON. The `accountNumberMasked` field only stores partial digits (e.g. `**** **** 9012`).

---

### 2.2 `projects` (Array of Objects)
Active and completed solar installation projects handled by the merchant.

| Field | Type | Required | Description / Constraints |
|---|---|---|---|
| `id` | string | Yes | Unique project ID (e.g. `"PRJ-QC-101"`). Must start with `PRJ-`. |
| `customerName` | string | Yes | Customer or corporate client display name |
| `location` | string | Yes | City or site location |
| `systemCapacity` | string | Yes | Kilowatt system size label (e.g. `"6.5 kW"`) |
| `systemType` | string | Yes | System architecture (e.g. `"Grid-Tie"`, `"Commercial Hybrid"`) |
| `panelBrand` | string | Yes | PV module brand, wattage, and type |
| `panelQuantity` | number | Yes | Total panel count (positive integer) |
| `inverterBrand` | string | Yes | Inverter model and rating |
| `batterySpecs` | string | Yes | Energy storage specifications or `"N/A"` |
| `assignedCrewId` | string | Yes | Must reference a valid `crewId` in `crews` (e.g. `"CREW-ALPHA"`), or `"Unassigned"` |
| `currentStage` | string | Yes | Allowed values: `"Site Survey"`, `"Engineering Approval"`, `"Permitting"`, `"Structural Mounting"`, `"Inverter & Grid-Tie Testing"`, `"Completed"` |
| `progress` | number | Yes | Integer between `0` and `100` |
| `targetDate` | string | Yes | Target completion or handover date |
| `projectValue` | number | Yes | Total solar system contract value in PHP (positive number) |
| `permitStatus` | string | Yes | LGU and utility interconnection permit status |
| `singleLineDiagramNote` | string | Yes | Electrical engineering and SLD permit notes |
| `installationSchedule` | string | Yes | Milestone sequence dates |
| `siteNotes` | string | Yes | Structural, roofing, and safety access observations |
| `nextAction` | string | Yes | Explicit, actionable next task for this project |

---

### 2.3 `payouts` (Array of Objects)
Itemized merchant sales commission disbursements.

| Field | Type | Required | Description / Constraints |
|---|---|---|---|
| `payoutId` | string | Yes | Unique payout reference (e.g. `"PAY-2026-081"`). Must start with `PAY-`. |
| `projectId` | string | Yes | Foreign key matching an existing `id` in `projects` |
| `projectName` | string | Yes | Matching project name for quick display |
| `milestone` | string | Yes | Milestone justification (e.g. `"50% Roof Mounting & Delivery"`) |
| `grossCommission` | number | Yes | Gross commission before statutory withholding tax in PHP |
| `withholdingTax` | number | Yes | Statutory 2% Creditable Withholding Tax (BIR CWT) in PHP (`gross * 0.02`) |
| `netDisbursement` | number | Yes | Net disbursement payable to merchant (`gross - withholdingTax`) |
| `status` | string | Yes | Allowed values: `"Released"`, `"Pending Review"`, `"On Hold"` |
| `releaseDate` | string | Yes | Date released or scheduled release batch date |
| `bankDestination` | string | Yes | Verified bank destination and masked account number |
| `bankConfirmation` | string | Yes | PESONet confirmation reference or batch queue indicator |
| `auditNotes` | string | Yes | Explanatory notes on milestone sign-offs or required documents |

---

### 2.4 `crews` (Array of Objects)
Installation teams and electrical engineering leads.

| Field | Type | Required | Description |
|---|---|---|---|
| `crewId` | string | Yes | Unique crew ID (e.g. `"CREW-ALPHA"`) |
| `teamName` | string | Yes | Display team name (e.g. `"Team Alpha"`) |
| `leadEngineer` | string | Yes | Licensed supervising engineer (REE / PEE) |
| `technicianHeadcount` | number | Yes | Number of deployed field specialists |
| `availability` | string | Yes | Operational deployment status |
| `contact` | string | Yes | Dispatch mobile number and direct email |
| `specialization` | string | Yes | Technical focus (e.g. Hybrid Battery, Commercial 3-Phase) |
| `vehiclesAssigned` | string | Yes | Assigned service vehicle plate and model |
| `certifications` | array | Yes | Array of verified credentials (e.g. TESDA NC II, DOLE BOSH, PRC) |
| `safetyCompliance` | string | Yes | Audit date and compliance status |

---

### 2.5 `milestones` (Array of Objects)
Key upcoming dates for utility inspections, disbursements, and commissioning.

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique milestone ID (e.g. `"MS-01"`) |
| `date` | string | Date label (e.g. `"Sept 12, 2026"`) |
| `projectId` | string | Valid foreign key pointing to `projects.id` |
| `projectName` | string | Project title |
| `title` | string | Action description |
| `status` | string | Progress indicator (e.g. `"Scheduled"`, `"Processing"`, `"Pending Docs"`) |

---

### 2.6 `support` (Object)
Contains `categories` and `faqs` for partner assistance.

- `categories`: Array of objects with `id`, `name`, and `description`.
- `faqs`: Array of objects with `id`, `category`, `question`, `answer`, and search `keywords` (array of strings).

---

### 2.7 `activity` (Array of Objects)
Recent field technician activity logs.

- `id`: Unique activity reference (e.g. `"ACT-01"`).
- `timestamp`: Relative time string (e.g. `"18 minutes ago"`).
- `crewId`: Assigned crew ID or `"SYSTEM"`.
- `crewName`: Display name.
- `title`: Short task summary.
- `projectId`: Related project ID.
- `projectName`: Related project display name.
- `detail`: Technical or inspection notes.

---

## 3. How to Update Data

### A. Static Web Hosting (HTTP / HTTPS)
1. Edit `assets/data/merchant.json` in your code editor.
2. Commit and push the file to your web server.
3. Reload any merchant portal page in your browser. The updated dataset will automatically be loaded and all KPI totals recalculated.

### B. Local Execution (`file:///` Protocol)
When running directly from local files without a local web server, web browsers block automated `fetch()` calls due to CORS policies.

1. Open any portal page (`dashboard.html`, `payments.html`, `installers.html`, `support.html`).
2. Scroll to the bottom and expand **"Local Workspace Preview Data (JSON Loader & Validator)"**.
3. Choose one of two options:
   - Click **"Choose File"** and select your modified `assets/data/merchant.json`.
   - Or paste your modified JSON string into the text box.
4. Click **"Apply & Validate JSON"**.
5. The built-in schema validator will instantly verify IDs, foreign keys, non-negative amounts, and status enums.
   - If valid: data is cached in `localStorage` and the page refreshes with your updated data.
   - If errors are found: detailed error messages are displayed and previous valid data is preserved.
6. To restore the default dataset at any time, click **"Reset to Default Dataset"**.
