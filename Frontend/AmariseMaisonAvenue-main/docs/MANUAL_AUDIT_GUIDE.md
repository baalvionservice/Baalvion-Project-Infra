# AMARISÉ MAISON AVENUE: INSTITUTIONAL AUDIT GUIDE

This guide provides specific pathways to manually verify every strategic feature implemented in the Maison platform.

## 1. THE DUAL-PERSONA DESIGN (Client Side)

### Design A: The Institutional Registry (Normal User)
- **Path**: `/us/product/prod-11`
- **Verify**:
  - Technical 3-column layout.
  - Vertical gallery thumbnails.
  - Product price displayed in local currency.
  - **PRIMARY ACTION**: Plum button "ADD TO SHOPPING BAG" with Golden Yellow hover.
  - Condition slider indicating "PRISTINE" status.

### Design B: The Private Salon (Private User)
- **Path**: `/us/private-order/prod-11`
- **Verify**:
  - Cinematic ivory background.
  - Full-width hero header with "Maison Private Salon" signifier.
  - Drop-cap narrative storytelling.
  - **PRIMARY ACTION**: Plum button "TRANSMIT PRIVATE BRIEF" with Golden Yellow hover.
  - Integrated acquisition form instead of immediate checkout.

---

## 2. THE ADMINISTRATIVE HIERARCHY (1 Super + 5 Hub Leads)

Use the **Maison Command Hub** (Gold Gear) to switch identities.

### Julian Vandervilt (Global Super Admin)
- **Oversight**: Total access to all 20 admin nodes.
- **Node to Check**: `admin/super` (Global Matrix).
- **Test**: Execute a "Safe Global Sync" to replicate registry data across all 5 hubs.

### India Hub Lead (Country Admin)
- **Oversight**: Isolated access to the India hub.
- **Node to Check**: `admin/revenue` or `admin/sales`.
- **Test**: Observe that only ₹ (INR) transactions and Mumbai-specific leads are visible.

---

## 3. HIGH-FREQUENCY ORCHESTRATION (The Owner's Suite)

### AI Autopilot & Batch Indexing
- **Node**: `admin/ai-dashboard`
- **Verify**:
  - Click **"BATCH GENERATE METADATA"**.
  - Monitor the "Neural Accuracy" and "Requests Processed" stats.
  - Verify that the AI is drafting market-specific SEO descriptors.

### The QA Stress Lab
- **Node**: `admin/qa`
- **Verify**:
  - Select "10,000 Items" load size.
  - Click **"AI Metadata Engine"** or **"Global CMS Replication"**.
  - Monitor the real-time "Throughput" (items/sec) and system reliability percentage.

---

## 4. REGISTRY & SEO AUTHORITY

### Atelier CMS (Product Control)
- **Node**: `admin/content`
- **Verify**:
  - Edit any artifact.
  - Update **Base Price** or **Stock**.
  - **Toggle Acquisition Strategy**: Switch between "Normal" and "Private" flow.
  - **SEO Audit**: Use the "Audit for Search Authority" button to see the Google optimization score.

### Integrations Hub
- **Node**: `admin/integrations`
- **Verify**:
  - Check "Search Engine" and "SEO Sitemap" health status.
  - **Emergency Mode**: Toggle the master kill-switch to simulate maintenance mode.

---

## 5. REVENUE & ACQUISITION

### Sales CRM (Tier 1 Leads)
- **Node**: `admin/sales`
- **Verify**:
  - Identify a "Tier 1" Priority Lead.
  - Click **"START DIALOGUE"** to open the secure curator terminal.
  - Send a message and watch the AI curator suggest a response based on the "Acquisition Scripts".

### Revenue Matrix
- **Node**: `admin/revenue`
- **Verify**:
  - Monitor the "Strategic Yield" by hub.
  - Review the "Acquisition Funnel" (Visitors -> Leads -> Buyers).
  - Observe the "Market Mitigation" alerts suggested by AI.
