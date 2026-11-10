# Order-to-Cash End-to-End Demonstration Script

This interactive demo script walks stakeholders through the Order-to-Cash (O2C) Revenue Leakage & Process Delay Tracker across 6 distinct user personas.

---

## Prerequisites
1. Start API Server: `npm run build --prefix backend/api && node backend/api/dist/server.js` (port 4000)
2. Start Frontend Dev: `npm run dev --prefix frontend` (port 5173)
3. Open browser at `http://localhost:5173/login`

---

## Persona 1: Executive & Finance Director (`analyst@o2c-demo.com`)
1. **Login**: Click the **Analyst** quick-login button on the login screen.
2. **Executive Overview**:
   - Observe the 4 KPI cards: **Total Revenue Leakage**, **Overdue AR Balance**, **Avg Cycle Time (Days)**, and **Active Exceptions**.
   - Review the **Revenue Breakdown** donut chart and the **Monthly Process Cycle Trend** bar chart.
3. **AR Aging Analysis**:
   - Click **AR Aging** in the sidebar (`/aging`).
   - Notice the aggregate aging bucket breakdown (0-30, 31-60, 61-90, 91+ days).
   - Change the **Cutoff Date** selector to `2026-06-01` and observe deterministic bucket recalculation without page reload.

---

## Persona 2: Audit & Revenue Assurance Specialist (`analyst@o2c-demo.com`)
1. **Revenue Leakage Explorer**:
   - Click **Leakage** in the sidebar (`/leakage`).
   - Filter or sort by **Leakage Type** (Underbilled, Overbilled, Unpaid Closed).
   - Click any order row (e.g. `SO-2026-000001`) to open the **Waterfall Drawer**.
   - Compare ordered amount vs fulfilled amount vs billed amount vs uncollected leakage.
2. **Algorithm Benchmark Evaluation**:
   - Click **Model Benchmark** in the sidebar (`/evaluation`).
   - Review the per-issue Precision, Recall, and F1 table (all 10 rules verified $\ge 90\%$ F1 score).
   - Confirm negative decoy counts (zero false positives across normal partial shipments and closed disputes).

---

## Persona 3: Support Agent (`support@o2c-demo.com`)
1. **Login as Support Agent**: Sign out and click **Support** (`support@o2c-demo.com`).
2. **Exception Workbench**:
   - Navigate to **Exceptions** (`/exceptions`).
   - Filter by Severity (`HIGH`, `CRITICAL`) or Issue Type (`INVOICE_EXCEEDS_FULFILLED`).
   - Click any exception finding (e.g. `FND-EXC-IL-000001`).
3. **Interactive Triage**:
   - In the right-hand inspection drawer, review the automated evidence JSON and the chronological lifecycle timeline.
   - Select **Triage Status** = `ACKNOWLEDGED`.
   - Enter note: `"Investigation escalated to billing ops for corrective invoice issue."`
   - Click **Triage**. Confirm instant audit confirmation and creation of an immutable `o2c.status_event` record.

---

## Persona 4: Sales Operations (`sales_ops@o2c-demo.com`)
1. **Login as Sales Ops**: Sign out and click **Sales Ops** (`sales_ops@o2c-demo.com`).
2. **Quote Lifecycle & Conversion**:
   - Navigate to **Raw Records** (`/records`).
   - Click the **QUOTE** entity tab.
   - Notice the dedicated **Convert** action button on eligible quotes.
   - Click **Convert** on any unconverted quote.
   - Confirm instant creation of a new Sales Order, copy of order lines, and status transition audit event.
   - Click **Convert** a second time to demonstrate **409 ALREADY_CONVERTED idempotency protection**.

---

## Persona 5: System Administrator (`admin@o2c-demo.com`)
1. **Login as Admin**: Sign out and click **Admin** (`admin@o2c-demo.com`).
2. **User & Role Administration**:
   - Notice the **Admin Users** navigation item (`/admin`) visible only to administrators.
   - View all provisioned user profiles and their assigned roles and tenant account scopes.
   - Change the role dropdown for `support@o2c-demo.com` to `analyst` and observe immediate persistence.
3. **Developer Deep Health Diagnostic**:
   - Press `Ctrl + Shift + D` (or click bottom-right wrench) to toggle the **Developer Toolkit DebugPanel**.
   - Verify all 12 applied migrations, PostgreSQL connectivity, RLS status, and operational row counts.

---

## Persona 6: Customer Tenant Scoping (`customer@o2c-demo.com`)
1. **Login as Customer**: Sign out and click **Customer** (`customer@o2c-demo.com`).
2. **Strict Row-Level Scoping**:
   - Observe that internal analytics pages (Leakage, Aging, Exceptions, Admin) are strictly hidden from the navigation sidebar.
   - Navigate to **Raw Records** (`/records`) and select quotes, orders, or invoices.
   - Notice that 100% of returned records belong exclusively to `ACC-000001`.
   - Manually type `http://localhost:5173/exceptions` in the browser address bar and observe automatic redirection and HTTP 403 Forbidden protection.

