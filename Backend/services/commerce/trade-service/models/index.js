'use strict';
const { Sequelize } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? console.log : false,
    define: {
        underscored: true,
        freezeTableName: true,
    },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User            = require('./users')(sequelize, Sequelize.DataTypes);
db.Organization    = require('./organizations')(sequelize, Sequelize.DataTypes);
db.Rfq             = require('./rfqs')(sequelize, Sequelize.DataTypes);
db.Deal            = require('./deals')(sequelize, Sequelize.DataTypes);
db.Order           = require('./orders')(sequelize, Sequelize.DataTypes);
db.Escrow          = require('./escrows')(sequelize, Sequelize.DataTypes);
db.Shipment        = require('./shipments')(sequelize, Sequelize.DataTypes);
db.Document        = require('./documents')(sequelize, Sequelize.DataTypes);
db.Payment         = require('./payments')(sequelize, Sequelize.DataTypes);
db.ComplianceCase  = require('./compliance')(sequelize, Sequelize.DataTypes);
db.Dispute         = require('./disputes')(sequelize, Sequelize.DataTypes);
db.Wallet          = require('./wallets')(sequelize, Sequelize.DataTypes);
db.Notification    = require('./notifications')(sequelize, Sequelize.DataTypes);
db.Listing         = require('./listings')(sequelize, Sequelize.DataTypes);
db.Quotation       = require('./quotations')(sequelize, Sequelize.DataTypes);
db.Message         = require('./messages')(sequelize, Sequelize.DataTypes);
db.Collection      = require('./collections')(sequelize, Sequelize.DataTypes);
db.AuditLog        = require('./audit_logs')(sequelize, Sequelize.DataTypes);
db.RefreshToken    = require('./refresh_tokens')(sequelize, Sequelize.DataTypes);
db.Carrier         = require('./carriers')(sequelize, Sequelize.DataTypes);
db.FreightQuote    = require('./freight_quotes')(sequelize, Sequelize.DataTypes);
db.BillOfLading    = require('./bills_of_lading')(sequelize, Sequelize.DataTypes);
db.CustomsEntry    = require('./customs_entries')(sequelize, Sequelize.DataTypes);
db.CertificateOfOrigin = require('./certificates_of_origin')(sequelize, Sequelize.DataTypes);
db.CarbonFootprint = require('./carbon_footprints')(sequelize, Sequelize.DataTypes);
db.InsurancePolicy = require('./insurance_policies')(sequelize, Sequelize.DataTypes);
db.InsuranceClaim  = require('./insurance_claims')(sequelize, Sequelize.DataTypes);

// ── Trade Operations Cloud (War Room 4) — schema `tradeops`, UUID PKs ────────
// Registered as TradeShipment (not Shipment) to avoid colliding with the legacy
// trade.shipments model above. All five carry tenant_id, so the tenant hooks
// below auto-scope them (they are NOT in TENANT_EXCLUDED).
db.TradeOperation        = require('./tradeops/trade_operation')(sequelize, Sequelize.DataTypes);
db.TradeShipment         = require('./tradeops/shipment')(sequelize, Sequelize.DataTypes);
db.ShipmentEvent         = require('./tradeops/shipment_event')(sequelize, Sequelize.DataTypes);
db.ShipmentDocument      = require('./tradeops/shipment_document')(sequelize, Sequelize.DataTypes);
db.ShipmentStatusHistory = require('./tradeops/shipment_status_history')(sequelize, Sequelize.DataTypes);

// ── Shipment Workflow State Machine (War Room 4, Prompt 2) — schema `tradeops` ──
// Deterministic, event-driven lifecycle engine. All four carry tenant_id, so the
// tenant hooks below auto-scope them (they are NOT in TENANT_EXCLUDED).
db.ShipmentWorkflow        = require('./tradeops/shipment_workflow')(sequelize, Sequelize.DataTypes);
db.WorkflowTransition      = require('./tradeops/workflow_transition')(sequelize, Sequelize.DataTypes);
db.WorkflowWebhook         = require('./tradeops/workflow_webhook')(sequelize, Sequelize.DataTypes);
db.WorkflowWebhookDelivery = require('./tradeops/workflow_webhook_delivery')(sequelize, Sequelize.DataTypes);

// ── Document Management System (War Room 4, Prompt 4) — schema `tradeops` ──────
// Production file engine: canonical documents + immutable versions (S3/encryption/
// scan metadata) + per-document event log. All carry tenant_id → auto-scoped by the
// tenant hooks below (NOT in TENANT_EXCLUDED). Registered as TradeDocument to avoid
// colliding with the legacy db.Document (trade.documents, INTEGER PK).
db.TradeDocument   = require('./tradeops/document')(sequelize, Sequelize.DataTypes);
db.DocumentVersion = require('./tradeops/document_version')(sequelize, Sequelize.DataTypes);
db.DocumentEvent   = require('./tradeops/document_event')(sequelize, Sequelize.DataTypes);

// ── AI Document Validation Engine (Prompt 5) — schema `tradeops` ──────────────
// Append-only audit of document validation runs (quantity/weight/address/currency/
// tax mismatch + missing-field checks). Carries tenant_id → auto-scoped by the
// tenant hooks below (NOT in TENANT_EXCLUDED).
db.DocumentValidation = require('./tradeops/document_validation')(sequelize, Sequelize.DataTypes);

// ── Shipment Readiness Score Engine (Prompt 6) — schema `tradeops` ────────────
// Append-only time series of weighted readiness snapshots (readiness +
// compliance/documentation/logistics/risk component scores). Carries tenant_id →
// auto-scoped by the tenant hooks below (NOT in TENANT_EXCLUDED).
db.ShipmentReadiness = require('./tradeops/shipment_readiness')(sequelize, Sequelize.DataTypes);

// ── HS Code Intelligence Engine (Prompt 7) — schema `tradeops` ────────────────
// HsCode + HsTariffLine are GLOBAL reference data (no tenant_id → skipped by the
// tenant hooks below, like Carrier). HsClassification carries tenant_id → it IS
// auto-scoped by the tenant hooks (append-only audit of classification runs).
db.HsCode           = require('./tradeops/hs_code')(sequelize, Sequelize.DataTypes);
db.HsTariffLine     = require('./tradeops/hs_tariff_line')(sequelize, Sequelize.DataTypes);
db.HsClassification = require('./tradeops/hs_classification')(sequelize, Sequelize.DataTypes);

// ── Compliance & Sanctions Engine (Prompt 8) — schema `tradeops` ──────────────
// SanctionedParty / ControlledGood / TradeBan are GLOBAL reference data (no
// tenant_id → skipped by the tenant hooks below, like HsCode). ComplianceListEntry
// (tenant blacklist/whitelist) and ComplianceScreening (append-only audit of
// screening runs) carry tenant_id → they ARE auto-scoped by the tenant hooks.
db.SanctionedParty      = require('./tradeops/sanctioned_party')(sequelize, Sequelize.DataTypes);
db.ControlledGood       = require('./tradeops/controlled_good')(sequelize, Sequelize.DataTypes);
db.TradeBan             = require('./tradeops/trade_ban')(sequelize, Sequelize.DataTypes);
db.ComplianceListEntry  = require('./tradeops/compliance_list_entry')(sequelize, Sequelize.DataTypes);
db.ComplianceScreening  = require('./tradeops/compliance_screening')(sequelize, Sequelize.DataTypes);

// ── Customs Gateway Abstraction Layer (Prompt 9) — schema `tradeops` ──────────
// Connector-driven government-gateway filings (ICEGATE/ACE/CDS/Mirsal). Both carry
// tenant_id → auto-scoped by the tenant hooks below (NOT in TENANT_EXCLUDED).
// CustomsSubmission tracks the filing lifecycle; CustomsSubmissionEvent is the
// append-only attempt/transition audit.
db.CustomsSubmission      = require('./tradeops/customs_submission')(sequelize, Sequelize.DataTypes);
db.CustomsSubmissionEvent = require('./tradeops/customs_submission_event')(sequelize, Sequelize.DataTypes);

// ── Freight Marketplace Integration Layer (Prompt 10) — schema `tradeops` ─────
// Carrier-connector-driven freight bookings (DHL/FedEx/UPS/Maersk) + the carrier
// fallback workflow. Both carry tenant_id → auto-scoped by the tenant hooks below
// (NOT in TENANT_EXCLUDED). FreightBooking tracks the booking lifecycle;
// FreightBookingEvent is the append-only quote/attempt/fallback/transition audit.
db.FreightBooking      = require('./tradeops/freight_booking')(sequelize, Sequelize.DataTypes);
db.FreightBookingEvent = require('./tradeops/freight_booking_event')(sequelize, Sequelize.DataTypes);

// ── Dispatch Orchestration Engine (Prompt 11) — schema `tradeops` ─────────────
// Automation engine that fires dispatch when a shipment's four gates clear
// (documents validated / compliance passed / customs ready / freight booked) via a
// rule engine, workflow-driven event triggers, a webhook system and a saga-based
// failure-rollback system. DispatchPlan is the orchestration aggregate (gate-state
// + rule + status); DispatchEvent is the append-only audit; DispatchWebhook +
// DispatchWebhookDelivery are the webhook subscription + signed-delivery trail. All
// carry tenant_id → auto-scoped by the tenant hooks below (NOT in TENANT_EXCLUDED).
db.DispatchPlan            = require('./tradeops/dispatch_plan')(sequelize, Sequelize.DataTypes);
db.DispatchEvent           = require('./tradeops/dispatch_event')(sequelize, Sequelize.DataTypes);
db.DispatchWebhook         = require('./tradeops/dispatch_webhook')(sequelize, Sequelize.DataTypes);
db.DispatchWebhookDelivery = require('./tradeops/dispatch_webhook_delivery')(sequelize, Sequelize.DataTypes);

// ── Compliance AI Agent (Prompt 13) — schema `tradeops` ───────────────────────
// AI agent that scans a shipment, detects risks and explains its reasoning via a
// rule + AI hybrid over the Prompt 8 sanctions engine. ComplianceAssessment is the
// append-only audit of agent runs (decision / risk_score / confidence / fused
// findings / reasoning chain). Carries tenant_id → auto-scoped by the tenant hooks
// below (NOT in TENANT_EXCLUDED).
db.ComplianceAssessment    = require('./tradeops/compliance_assessment')(sequelize, Sequelize.DataTypes);

// ── Logistics Optimization Agent (Prompt 14) — schema `tradeops` ──────────────
// Route optimizer: carrier selection + multi-leg route optimization over a lane
// network + cost-vs-speed scoring → cheapest / fastest / balanced route. RouteOptimization
// is the persisted run (request + ranked candidates + the three picks + the committed
// route); RouteOptimizationEvent is the append-only optimize/select audit. Both carry
// tenant_id → auto-scoped by the tenant hooks below (NOT in TENANT_EXCLUDED).
db.RouteOptimization       = require('./tradeops/route_optimization')(sequelize, Sequelize.DataTypes);
db.RouteOptimizationEvent  = require('./tradeops/route_optimization_event')(sequelize, Sequelize.DataTypes);

// ── Tasks (Phase 1 Trade Agent workspace) — schema `tradeops` ────────────────
// Generic tenant-scoped to-do tracking. Carries tenant_id → auto-scoped by the
// tenant hooks below (NOT in TENANT_EXCLUDED).
db.Task = require('./tradeops/task')(sequelize, Sequelize.DataTypes);

// ── Support / ticketing (Phase 1 Buyer workspace) — schema `tradeops` ────────
// Self-service support tickets + threaded replies. Both carry tenant_id →
// auto-scoped by the tenant hooks below (NOT in TENANT_EXCLUDED).
db.SupportTicket        = require('./tradeops/support_ticket')(sequelize, Sequelize.DataTypes);
db.SupportTicketMessage = require('./tradeops/support_ticket_message')(sequelize, Sequelize.DataTypes);

// ── Purchase Orders (Phase 1 core-commerce alignment) — schema `tradeops` ────
// The formal buyer→seller order document generated after a quotation is accepted;
// distinct from trade.orders (fulfillment tracking). Carries tenant_id → auto-scoped
// by the tenant hooks below (NOT in TENANT_EXCLUDED).
db.PurchaseOrder = require('./tradeops/purchase_order')(sequelize, Sequelize.DataTypes);

// ── Phase 2: Trust, Verification & Compliance Foundation — schema `tradeops` ──
// Verification Center: per-org-per-category status cache (VerificationChecklistItem,
// carries tenant_id → auto-scoped by the tenant hooks below) + the country-
// configurable tax-identifier catalog (TaxIdType — GLOBAL reference data, no
// tenant_id, like HsCode). See migration 025 + service/verification/checklist.js.
db.VerificationChecklistItem = require('./tradeops/verification_checklist_item')(sequelize, Sequelize.DataTypes);
db.TaxIdType                 = require('./tradeops/tax_id_type')(sequelize, Sequelize.DataTypes);

// Identity Verification (Step 2) — per-user KYC, optionally tagged with the org
// context it was submitted under. Carries tenant_id → auto-scoped by the tenant
// hooks below.
db.IdentityVerification = require('./tradeops/identity_verification')(sequelize, Sequelize.DataTypes);

// Company Verification + Director/Beneficial-Owner Verification (Step 3) —
// workflow wrapper 1:1 with Organization, plus its stakeholders. Both carry
// tenant_id → auto-scoped by the tenant hooks below.
db.CompanyVerification = require('./tradeops/company_verification')(sequelize, Sequelize.DataTypes);
db.CompanyStakeholder  = require('./tradeops/company_stakeholder')(sequelize, Sequelize.DataTypes);

// Tax Verification (Step 4) — org tax identifiers keyed against TaxIdType. Carries
// tenant_id → auto-scoped by the tenant hooks below.
db.TaxRegistration = require('./tradeops/tax_registration')(sequelize, Sequelize.DataTypes);

// Bank Verification (Step 5) — envelope-encrypted account numbers (see
// service/verification/bank.js). Carries tenant_id → auto-scoped by the tenant
// hooks below.
db.BankAccount = require('./tradeops/bank_account')(sequelize, Sequelize.DataTypes);

// Address Verification (Step 6) — registered/corporate/factory/warehouse/branch
// addresses + their supporting-document evidence. Both carry tenant_id →
// auto-scoped by the tenant hooks below.
db.VerifiedAddress  = require('./tradeops/verified_address')(sequelize, Sequelize.DataTypes);
db.AddressEvidence  = require('./tradeops/address_evidence')(sequelize, Sequelize.DataTypes);

// Factory & Warehouse Verification (Step 7) — production/warehouse profile beyond
// a bare address. Carries tenant_id → auto-scoped by the tenant hooks below.
db.Facility = require('./tradeops/facility')(sequelize, Sequelize.DataTypes);

// Product & Certificate Verification (Step 8) — quality/safety/product certs,
// optionally classified against the existing HS Code Intelligence Engine. Carries
// tenant_id → auto-scoped by the tenant hooks below.
db.ProductCertificate = require('./tradeops/product_certificate')(sequelize, Sequelize.DataTypes);

// Compliance Engine (Step 10) — data-driven onboarding rules layered on the
// existing sanctions/KYC screening engine. ComplianceRule is global config (no
// tenant_id); ComplianceRuleEvaluation carries tenant_id → auto-scoped by the
// tenant hooks below.
db.ComplianceRule           = require('./tradeops/compliance_rule')(sequelize, Sequelize.DataTypes);
db.ComplianceRuleEvaluation = require('./tradeops/compliance_rule_evaluation')(sequelize, Sequelize.DataTypes);

// Fraud Detection (Step 11) — duplicate company/tax-ID/bank-account, suspicious
// login, multi-account-same-identity, suspicious document alerts. Carries
// tenant_id → auto-scoped by the tenant hooks below.
db.FraudSignal = require('./tradeops/fraud_signal')(sequelize, Sequelize.DataTypes);

// Risk Assessment Engine (Step 12) — append-only org risk scoring history. Carries
// tenant_id → auto-scoped by the tenant hooks below.
db.OrgRiskAssessment = require('./tradeops/org_risk_assessment')(sequelize, Sequelize.DataTypes);

// Trust Score Engine (Step 13) — append-only 0-100 composite score history.
// Carries tenant_id → auto-scoped by the tenant hooks below.
db.TrustScore = require('./tradeops/trust_score')(sequelize, Sequelize.DataTypes);

// Reputation System (Step 14) — buyer/seller/agent ratings + denormalized
// per-org-per-role summary. Both carry tenant_id → auto-scoped by the tenant hooks
// below.
db.ReputationRating = require('./tradeops/reputation_rating')(sequelize, Sequelize.DataTypes);
db.ReputationSummary = require('./tradeops/reputation_summary')(sequelize, Sequelize.DataTypes);

// Manual Review Console (Step 15) — human-facing review decision log wrapping
// approve/reject/request-info/escalate over every reviewable entity above.
// Carries tenant_id → auto-scoped by the tenant hooks below.
db.ReviewAction = require('./tradeops/review_action')(sequelize, Sequelize.DataTypes);

// ── Logistics Core Foundation, Phase 1 (containers, packages, addresses, GPS
// tracking) — schema `tradeops`. Container/LogisticsPackage/LogisticsAddress
// carry tenant_id -> auto-scoped by the tenant hooks below. TrackingEvent also
// carries tenant_id (high-volume, append-only telemetry, auto-scoped like
// ShipmentEvent). LogisticsRolePermission is GLOBAL reference data (no
// tenant_id, like HsCode) documenting the role -> permission catalog consumed
// by middleware/permissions.js.
db.Container              = require('./tradeops/container')(sequelize, Sequelize.DataTypes);
db.LogisticsPackage       = require('./tradeops/package')(sequelize, Sequelize.DataTypes);
db.LogisticsAddress       = require('./tradeops/address')(sequelize, Sequelize.DataTypes);
db.TrackingEvent          = require('./tradeops/tracking_event')(sequelize, Sequelize.DataTypes);
db.LogisticsRolePermission = require('./tradeops/logistics_role_permission')(sequelize, Sequelize.DataTypes);

// ── Logistics Core Foundation, Phase 2 (warehouses, fleet) — schema
// `tradeops`. All five carry tenant_id -> auto-scoped by the tenant hooks
// below. Distinct from db.Facility (Phase 2 Trust/Verification: an org's
// DECLARED factory/warehouse profile for KYC review) — Warehouse is the
// operational record inventory/containers actually reference.
db.Warehouse          = require('./tradeops/warehouse')(sequelize, Sequelize.DataTypes);
db.InventoryMovement  = require('./tradeops/inventory_movement')(sequelize, Sequelize.DataTypes);
db.Vehicle            = require('./tradeops/vehicle')(sequelize, Sequelize.DataTypes);
db.Driver             = require('./tradeops/driver')(sequelize, Sequelize.DataTypes);
db.FleetAssignment    = require('./tradeops/fleet_assignment')(sequelize, Sequelize.DataTypes);

// ── Logistics Core Foundation, Phase 3 (cost ledger, incidents, returns) —
// schema `tradeops`. All three carry tenant_id -> auto-scoped by the tenant
// hooks below. ShipmentReturn is registered under that name (not `Return`) to
// avoid the reserved word.
db.ShipmentCharge = require('./tradeops/shipment_charge')(sequelize, Sequelize.DataTypes);
db.Incident       = require('./tradeops/incident')(sequelize, Sequelize.DataTypes);
db.ShipmentReturn = require('./tradeops/return')(sequelize, Sequelize.DataTypes);

// ── Freight Management, Phase 1 (Phase 3, Prompt 2) — schema `tradeops` ───────
// CarrierDirectory/CarrierService/CarrierRegion/CarrierPerformance are GLOBAL
// reference data (no tenant_id → skipped by the tenant hooks below, like HsCode) —
// the dynamic carrier registry every tenant reads, replacing the hardcoded
// CARRIER_PROFILES object in service/freight/schema.js. Registered as
// `CarrierDirectory` (not `Carrier`) to avoid colliding with the legacy
// db.Carrier (schema `trade`, string PK, read-only shim kept live).
// FreightRateRule/FreightRate/FreightQuote/FreightQuoteItem/FreightComparison all
// carry tenant_id → auto-scoped by the tenant hooks below (NOT in TENANT_EXCLUDED);
// a tenant's negotiated rates and quote requests are private.
db.CarrierDirectory  = require('./tradeops/carrier')(sequelize, Sequelize.DataTypes);
db.CarrierService    = require('./tradeops/carrier_service')(sequelize, Sequelize.DataTypes);
db.CarrierRegion     = require('./tradeops/carrier_region')(sequelize, Sequelize.DataTypes);
db.CarrierPerformance = require('./tradeops/carrier_performance')(sequelize, Sequelize.DataTypes);
db.FreightRateRule    = require('./tradeops/freight_rate_rule')(sequelize, Sequelize.DataTypes);
db.FreightRate        = require('./tradeops/freight_rate')(sequelize, Sequelize.DataTypes);
db.FreightQuoteRequest = require('./tradeops/freight_quote')(sequelize, Sequelize.DataTypes);
db.FreightQuoteItem   = require('./tradeops/freight_quote_item')(sequelize, Sequelize.DataTypes);
db.FreightComparison  = require('./tradeops/freight_comparison')(sequelize, Sequelize.DataTypes);

// ── Warehouse Management System, Phase A (Phase 3, Prompt 3) — schema
// `tradeops`. Location hierarchy (WarehouseZone/WarehouseBin, the latter
// self-referencing via parent_bin_id), receiving (GoodsReceiptNote/
// GoodsReceiptLine) and the rule-based putaway engine's persisted output
// (PutawayTask). All five carry tenant_id -> auto-scoped by the tenant hooks
// below (NOT in TENANT_EXCLUDED).
db.WarehouseZone      = require('./tradeops/warehouse_zone')(sequelize, Sequelize.DataTypes);
db.WarehouseBin       = require('./tradeops/warehouse_bin')(sequelize, Sequelize.DataTypes);
db.GoodsReceiptNote   = require('./tradeops/goods_receipt_note')(sequelize, Sequelize.DataTypes);
db.GoodsReceiptLine   = require('./tradeops/goods_receipt_line')(sequelize, Sequelize.DataTypes);
db.PutawayTask        = require('./tradeops/putaway_task')(sequelize, Sequelize.DataTypes);

// ── Shipment Tracking & Global Visibility Platform (Phase 3, Prompt 6) —
// schema `tradeops`. Geofence/GeofenceEvent add zone entry/exit/dwell
// detection on top of the existing TrackingEvent stream. ShipmentCheckpoint
// adds dwell/delay-aware physical stops. ShipmentAlert/ShipmentNotification
// are the alert ledger + per-channel delivery fan-out. IotDevice/IotSensorLog
// add sensor telemetry. ProofOfDelivery captures delivery evidence.
// EtaPrediction/DelayEvent are the live in-transit ETA + delay-cause history.
// ShipmentRoute is the planned/actual multi-leg journey. All carry tenant_id
// -> auto-scoped by the tenant hooks below (NOT in TENANT_EXCLUDED).
db.Geofence             = require('./tradeops/geofence')(sequelize, Sequelize.DataTypes);
db.GeofenceEvent        = require('./tradeops/geofence_event')(sequelize, Sequelize.DataTypes);
db.ShipmentCheckpoint   = require('./tradeops/shipment_checkpoint')(sequelize, Sequelize.DataTypes);
db.ShipmentAlert        = require('./tradeops/shipment_alert')(sequelize, Sequelize.DataTypes);
db.ShipmentNotification = require('./tradeops/shipment_notification')(sequelize, Sequelize.DataTypes);
db.IotDevice            = require('./tradeops/iot_device')(sequelize, Sequelize.DataTypes);
db.IotSensorLog         = require('./tradeops/iot_sensor_log')(sequelize, Sequelize.DataTypes);
db.ProofOfDelivery      = require('./tradeops/proof_of_delivery')(sequelize, Sequelize.DataTypes);
db.EtaPrediction        = require('./tradeops/eta_prediction')(sequelize, Sequelize.DataTypes);
db.DelayEvent           = require('./tradeops/delay_event')(sequelize, Sequelize.DataTypes);
db.ShipmentRoute        = require('./tradeops/shipment_route')(sequelize, Sequelize.DataTypes);

Object.values(db).forEach(model => {
    if (model && model.associate) model.associate(db);
});

// ── Centralized multi-tenant isolation ──────────────────────────────────────
// Per-model hooks auto-inject the tenant filter on reads and stamp it on writes,
// using the request's AsyncLocalStorage context. Excludes User (auth/login is
// pre-tenant) and AuditLog (single global hash chain).
const { currentTenant } = require('../middleware/tenantContext');
// Excluded from blunt single-tenant scoping:
//  - User/AuditLog: auth is pre-tenant; audit is a single global hash chain.
//  - Listing/Rfq: marketplace + discovery are cross-tenant by design.
//  - Deal/Quotation/Message/PurchaseOrder: buyer↔seller dual-party negotiation
//    (visible to both orgs) — these need participant-based authorization, not a
//    tenant_id filter (tracked as a follow-up). Organization is shared
//    counterparty data. PurchaseOrder is stamped with the BUYER's tenant_id at
//    creation, so without this exclusion the seller's own tenant context would
//    get auto-injected into every read/write and silently 404 the seller out of
//    a PO they are a legitimate party to — purchaseOrderController.fetchPoOwned
//    already does its own buyer_org_id/seller_org_id participant check.
// Everything else (Order/Escrow/Shipment/Document/Payment/ComplianceCase/
// Dispute/Wallet/Notification/Collection) is a private single-owner record and
// IS tenant-scoped.
const TENANT_EXCLUDED = new Set([
    'User', 'AuditLog', 'Sequelize', 'sequelize',
    'Listing', 'Rfq', 'Deal', 'Quotation', 'Message', 'Organization', 'PurchaseOrder',
    // Carrier: shared logistics marketplace (global registry, no tenant_id) — like Listing.
    'Carrier',
    // RefreshToken: auth/session management is pre-tenant and scoped by user_id
    // explicitly (the refresh endpoint has no valid access token / tenant ctx).
    'RefreshToken',
    // LogisticsRolePermission: global role->permission catalog reference data,
    // no tenant_id — like HsCode.
    'LogisticsRolePermission',
    // Freight Management (Phase 3, Prompt 2): CarrierDirectory/CarrierService/
    // CarrierRegion/CarrierPerformance are shared reference data (no tenant_id) —
    // like Carrier/HsCode. FreightRateRule/FreightRate/FreightQuoteRequest/
    // FreightQuoteItem/FreightComparison DO carry tenant_id and are intentionally
    // NOT excluded (a tenant's negotiated rates and quotes are private).
    'CarrierDirectory', 'CarrierService', 'CarrierRegion', 'CarrierPerformance',
]);

const tenantAttr = (model) => {
    const a = model.rawAttributes || {};
    if (a.tenant_id) return 'tenant_id';
    if (a.tenantId) return 'tenantId';
    return null;
};

Object.entries(db).forEach(([name, model]) => {
    if (TENANT_EXCLUDED.has(name) || !model || typeof model.addHook !== 'function') return;
    const attr = tenantAttr(model);
    if (!attr) return;

    // Reads: inject tenant filter unless caller is a super-admin (bypass) or
    // the query already constrains the tenant attribute explicitly.
    model.addHook('beforeFind', (options) => {
        const ctx = currentTenant();
        if (!ctx || ctx.bypass || !ctx.tenantId) return;
        options.where = options.where || {};
        if (options.where[attr] === undefined) options.where[attr] = ctx.tenantId;
    });

    // Writes: stamp the tenant on create when not explicitly set.
    model.addHook('beforeCreate', (instance) => {
        const ctx = currentTenant();
        if (!ctx || ctx.bypass || !ctx.tenantId) return;
        if (instance[attr] == null) instance[attr] = ctx.tenantId;
    });
    model.addHook('beforeBulkCreate', (instances) => {
        const ctx = currentTenant();
        if (!ctx || ctx.bypass || !ctx.tenantId) return;
        instances.forEach((i) => { if (i[attr] == null) i[attr] = ctx.tenantId; });
    });

    // Bulk update/destroy: constrain to the caller's tenant.
    const scopeBulk = (options) => {
        const ctx = currentTenant();
        if (!ctx || ctx.bypass || !ctx.tenantId) return;
        options.where = options.where || {};
        if (options.where[attr] === undefined) options.where[attr] = ctx.tenantId;
    };
    model.addHook('beforeBulkUpdate', scopeBulk);
    model.addHook('beforeBulkDestroy', scopeBulk);
});

module.exports = db;
