'use strict';
const router = require('express').Router();

router.use('/auth',          require('./authRoutes'));
router.use('/organizations', require('./organizationRoutes'));
router.use('/companies',     require('./organizationRoutes'));
router.use('/marketplace_listings', require('./listingRoutes'));
router.use('/rfqs',          require('./rfqRoutes'));
router.use('/quotations',    require('./quotationRoutes'));
router.use('/chat_messages', require('./messageRoutes'));
router.use('/deals',         require('./dealRoutes'));
router.use('/orders',        require('./orderRoutes'));
router.use('/purchase_orders', require('./purchaseOrderRoutes'));
router.use('/escrows',       require('./escrowRoutes'));
router.use('/shipments',     require('./shipmentRoutes'));
router.use('/documents',     require('./documentRoutes'));
router.use('/payments',      require('./paymentRoutes'));
router.use('/compliance',    require('./complianceRoutes'));
router.use('/disputes',      require('./disputeRoutes'));
router.use('/wallets',       require('./walletRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/admin',         require('./adminRoutes'));

// Phase 1 — Tasks (trade-agent workspace) + Support ticketing (buyer workspace).
router.use('/tasks',            require('./taskRoutes'));
router.use('/support_tickets',  require('./supportRoutes'));

// Bespoke aggregation + provider endpoints (single objects, not collection arrays).
router.get('/platform_stats', require('../controller/statsController').platformStats);
router.use('/fx', require('./fxRoutes'));
router.get('/providers/health', require('../controller/providersController').health);
router.use('/audit', require('./auditRoutes'));
router.use('/queues', require('./queueRoutes'));

// Live system telemetry (infra topology / pulse / readiness) — real measured stack state.
const systemController = require('../controller/systemController');
router.get('/system/services',  systemController.services);
router.get('/system/pulse',     systemController.pulse);
router.get('/system/readiness', systemController.readiness);

// Internal service-to-service ingress (HMAC-authenticated). Java→Node finance event bridge.
router.use('/internal', require('./internalRoutes'));

// Logistics — Freight Booking: carrier marketplace + quote engine + selection (typed; shadow the store).
const freightController = require('../controller/freightController');
router.use('/carriers', require('./carrierRoutes'));
router.get('/shipping_quotes',      freightController.getQuotes);
router.post('/shipping_selections', freightController.selectCarrier);

// Freight Management (Phase 3, Prompt 2): dynamic Carrier Directory, persisted Rate
// Engine, persisted Quote Requests (with per-carrier charge breakdown + scored
// comparison) and Carrier Performance. Mounted at more specific /freight/* prefixes
// BEFORE freightMarketplaceRoutes below so its generic GET /:id booking-lookup
// route never shadows these (Express tries router.use() mounts in registration
// order and falls through only on no match — see routes/v1.js history for the
// same pattern with the trailing /:collection catch-all).
router.use('/freight/carrier-directory',   require('./carrierDirectoryRoutes'));
router.use('/freight/quote-requests',      require('./freightQuoteRoutes'));
router.use('/freight/carrier-performance', require('./carrierPerformanceRoutes'));
router.use('/freight', require('./freightRateEngineRoutes')); // /rate-rules, /rate-preview

// Logistics — Freight Marketplace Integration Layer (War Room 4, Prompt 10):
// carrier abstraction (DHL/FedEx/UPS/Maersk connectors) + quote COMPARISON engine +
// ETA calculation + the booking workflow with carrier-to-carrier FALLBACK logic.
router.use('/freight', require('./freightMarketplaceRoutes'));

// Logistics — Digital Bill of Lading: typed e-B/L with title-transfer/surrender lifecycle.
router.use('/bills_of_lading', require('./billOfLadingRoutes'));

// Logistics — Customs Filing: typed customs entries + HS classifier + tariff + country templates.
router.use('/customs_entries', require('./customsRoutes'));

// Logistics — Certificate of Origin: typed CoO with issue → chamber-certify lifecycle + e-stamp.
router.use('/certificates_of_origin', require('./certificateOfOriginRoutes'));

// Logistics — Carbon Footprint (P2): CO2e estimate per shipment + offset + ESG report.
router.use('/carbon_footprints', require('./carbonRoutes'));

// Insurance — cargo/credit/parametric policies (quote→bind) + claims (file→pay) lifecycle.
router.use('/insurance_policies', require('./insuranceRoutes'));
router.use('/insurance_claims', require('./insuranceClaimsRoutes'));
// General Average (migration 066) — voyage-wide loss apportionment after a
// casualty. Runs alongside the cargo policy, not through it: every interest on
// the voyage contributes, insured or not.
router.use('/general_average', require('./generalAverageRoutes'));
// Underwriters + binders (migration 071) — whose paper the cover is written on and
// the delegated authority the platform holds on it.
router.use('/insurance_underwriters', require('./underwriterRoutes'));

// Trade Operations — Shipment Workflow State Machine (War Room 4, Prompt 2):
// deterministic event-driven lifecycle engine + transition event log + webhooks.
router.use('/shipment_workflows', require('./workflowRoutes'));

// Trade Operations — Document Management System / production file engine (War Room 4,
// Prompt 4): secure upload → S3-compatible storage → versioning → virus scan →
// envelope encryption → metadata extraction → shipment linkage + chain of custody.
router.use('/trade_documents', require('./tradeDocumentRoutes'));

// Trade Operations — AI Document Validation Engine (Prompt 5): rules engine +
// pluggable AI classification layer checking trade documents for quantity/weight/
// address/currency/tax mismatches and missing fields, emitting a validation_report
// + readiness-impact score.
router.use('/document_validations', require('./validationRoutes'));

// Trade Operations — shared operations Dashboard APIs (War Room 4, Prompt 3):
// filtered/paginated shipments, merged timeline, readiness score, documents,
// comments — RBAC (buyer/seller/admin/logistics/bank) + tenant isolation +
// caching + per-caller rate limiting.
router.use('/dashboard', require('./dashboardRoutes'));

// Trade Operations — Shipment Readiness Score Engine (Prompt 6): weighted 0–100
// readiness from compliance/documentation/logistics/risk component scores, with
// DB-persisted snapshot history, a Redis cache layer and event-triggered
// recalculation (workflow transition / document validation / shipment status).
router.use('/shipment_readiness', require('./readinessRoutes'));

// Trade Operations — HS Code Intelligence Engine (Prompt 7): product → HS code
// classification (keyword search + pluggable AI suggester + deterministic
// fallback rules engine), multi-country tariff mapping, confidence scoring,
// compliance flags and duty-estimation hooks.
router.use('/hs_codes', require('./hsCodeRoutes'));

// Trade Operations — Compliance & Sanctions Engine (Prompt 8): rules engine over
// sanctioned countries/parties, restricted + dual-use + prohibited goods and
// country-specific export/import bans, with a tenant blacklist/whitelist, KYC/AML
// hooks and violation severity scoring → clear/review/block decision + persisted
// screening audit. Distinct from the legacy /v1/compliance ComplianceCase CRUD.
router.use('/compliance_screening', require('./complianceEngineRoutes'));

// Trade Operations — Customs Gateway Abstraction Layer (Prompt 9): connector
// architecture (CustomsConnector base → ICEGATE/ACE/EU-CDS/Mirsal) with an async
// submission pipeline, in-process + durable-queue retry, failure recovery and
// cross-gateway response normalization. Distinct from the legacy typed
// /v1/customs_entries declaration CRUD.
router.use('/customs_submissions', require('./customsGatewayRoutes'));

// Trade Operations — Dispatch Orchestration Engine (Prompt 11): automation engine
// that fires a shipment's dispatch the moment its four gates clear (documents
// validated, compliance passed, customs ready, freight booked) via a rule engine,
// workflow-driven event triggers, a webhook system and a saga-based failure-rollback
// system. Plans auto-advance from gate signals emitted by the shipment workflow.
router.use('/dispatch_orchestrations', require('./dispatchRoutes'));

// Trade Operations — Compliance AI Agent (Prompt 13): an AI agent that scans a
// shipment, detects risks, flags compliance issues and EXPLAINS its reasoning via
// a rule + AI hybrid over the Prompt 8 sanctions engine — with first-class
// confidence scoring and explainability output. Distinct from the deterministic
// /v1/compliance_screening rule engine it builds on.
router.use('/compliance_agent', require('./complianceAgentRoutes'));

// Trade Operations — Logistics Optimization Agent (Prompt 14): carrier selection +
// multi-leg route optimization over a lane network + cost-vs-speed scoring. Returns
// the cheapest / fastest / balanced route for a shipment, persists the run, and lets
// the caller commit a route (handing off to the Prompt 10 freight marketplace to
// book its first leg). Network descriptor is public at /network.
router.use('/route_optimizations', require('./logisticsRoutes'));

// Logistics Core Foundation (Phase 1): containers, packages, general-purpose
// address book (distinct from /verified_addresses, which is KYC evidence), and
// GPS/carrier tracking events. Extends the existing shipment/customs/freight
// stack above rather than duplicating it.
router.use('/containers',      require('./containerRoutes'));
router.use('/packages',        require('./packageRoutes'));
router.use('/logistics_addresses', require('./addressRoutes'));
router.use('/tracking_events', require('./trackingRoutes'));

// Logistics Core Foundation (Phase 2): operational warehouses + inventory
// movement ledger, and fleet (vehicles, drivers, assignments).
router.use('/warehouses',          require('./warehouseRoutes'));
router.use('/inventory_movements', require('./inventoryMovementRoutes'));
router.use('/vehicles',            require('./vehicleRoutes'));
router.use('/drivers',             require('./driverRoutes'));
router.use('/fleet_assignments',   require('./fleetAssignmentRoutes'));

// Warehouse Management System, Phase A (Phase 3, Prompt 3): location hierarchy
// (zones/bins, the latter self-referencing aisle->rack->shelf->bin), receiving
// + Goods Receipt Notes, and the rule-based putaway engine. Extends the
// existing operational warehouses + inventory movement ledger above.
router.use('/warehouse_zones',      require('./warehouseZoneRoutes'));
router.use('/warehouse_bins',       require('./warehouseBinRoutes'));
router.use('/goods_receipt_notes',  require('./goodsReceiptRoutes'));
router.use('/putaway_tasks',        require('./putawayRoutes'));

// Logistics Core Foundation (Phase 3): itemized cost ledger, incidents, RMA returns.
router.use('/shipment_charges', require('./shipmentChargeRoutes'));
router.use('/incidents',        require('./incidentRoutes'));
router.use('/returns',          require('./returnRoutes'));

// Phase 2 — Trust, Verification & Compliance Foundation: Verification Center
// dashboard (per-org checklist across identity/company/tax/bank/address/factory/
// warehouse/products/documents/compliance/risk/trust-score) + the country-
// configurable tax-identifier catalog it reads from.
router.use('/verification_center',    require('./verificationCenterRoutes'));
// KYC/KYB vendor callbacks + which adapter is active (migration 070). Vendor-signed,
// so the webhook is deliberately outside the session auth path.
router.use('/kyc_provider',           require('./kycProviderRoutes'));
router.use('/tax_id_types',           require('./taxIdTypeRoutes'));
router.use('/identity_verifications', require('./identityVerificationRoutes'));
router.use('/company_verifications', require('./companyVerificationRoutes'));
router.use('/company_stakeholders',  require('./companyStakeholderRoutes'));
router.use('/tax_registrations',     require('./taxRegistrationRoutes'));
router.use('/bank_accounts',         require('./bankAccountRoutes'));
router.use('/verified_addresses',    require('./verifiedAddressRoutes'));
router.use('/facilities',            require('./facilityRoutes'));
router.use('/product_certificates',  require('./productCertificateRoutes'));
router.use('/compliance_rules',      require('./complianceRuleRoutes'));
router.use('/fraud_signals',         require('./fraudSignalRoutes'));
router.use('/risk_assessments',      require('./riskAssessmentRoutes'));
router.use('/trust_scores',          require('./trustScoreRoutes'));
router.use('/reputation',            require('./reputationRoutes'));
router.use('/review_actions',        require('./reviewActionRoutes'));
router.use('/compliance_dashboard',  require('./complianceDashboardRoutes'));
router.use('/monitoring',            require('./monitoringRoutes'));

// Shipment Tracking & Global Visibility Platform (Phase 3, Prompt 6): builds
// on tradeops.shipments (TradeShipment) + the existing TrackingEvent/
// ShipmentEvent/ShipmentStatusHistory streams above rather than duplicating
// them. Geofencing, checkpoints-with-dwell, alerts/notifications, IoT, proof
// of delivery, live ETA re-prediction, delay-cause detection, planned
// multi-leg routes, cross-entity search, the dashboard KPI/map aggregate, and
// CSV/JSON report export.
router.use('/geofences',           require('./geofenceRoutes'));
router.use('/shipment_checkpoints', require('./shipmentCheckpointRoutes'));
router.use('/shipment_alerts',      require('./shipmentAlertRoutes'));
router.use('/iot_devices',          require('./iotDeviceRoutes'));
router.use('/proof_of_delivery',    require('./proofOfDeliveryRoutes'));
router.use('/eta_predictions',      require('./etaPredictionRoutes'));
router.use('/delay_events',         require('./delayEventRoutes'));
router.use('/shipment_routes',      require('./shipmentRouteRoutes'));
router.use('/tracking_search',      require('./trackingSearchRoutes'));
router.use('/tracking_dashboard',   require('./logisticsTrackingDashboardRoutes'));
router.use('/tracking_reports',     require('./trackingReportRoutes'));
router.use('/intelligence',         require('./intelligenceRoutes'));

// Vessel Sailing Schedules (migration 065) — carrier-published "which ship sails
// from where, when". Independent of any booking: shippers read it to choose a
// sailing, and shipments then reference the voyage they ride on.
router.use('/sailing_schedules',    require('./scheduleRoutes'));

// World Shipping Directory (migration 067) — the PUBLIC, unauthenticated reference
// directory of shipping companies and their ships. Mounted under /public/ to make the
// absence of authMiddleware in shippingDirectoryRoutes.js deliberate and greppable
// rather than an oversight: everything under it is openly-licensed reference data
// (Wikidata CC0 + a dated Alphaliner capacity ranking), never tenant rows.
router.use('/public/shipping',      require('./shippingDirectoryRoutes'));

// Clearance Compression (migrations 078-080). The stage ledger measures where the
// ~19-day paperwork cycle actually goes; consignments are the canonical record
// every trade document derives from; the corridor gate stops a filing that would
// bounce from ever being submitted; the clearance gates expose the parallel work
// front that replaces the linear stage chain.
router.use('/clearance_ledger',  require('./clearanceLedgerRoutes'));
router.use('/clearance_gates',   require('./clearanceGateRoutes'));
router.use('/consignments',      require('./consignmentRoutes'));
router.use('/corridor',          require('./corridorRoutes'));

// Clearance Compression, continued (migrations 081-084). Pre-arrival filing moves
// the customs decision ahead of the vessel; the duty rail turns payment into a
// ledger debit; trusted-trader status is the only lever that changes what the
// AUTHORITY does; delegated authority removes the overnight wait for a human.
router.use('/prearrival',        require('./preArrivalRoutes'));
router.use('/duty',              require('./dutyRoutes'));
router.use('/trusted_trader',    require('./trustedTraderRoutes'));
router.use('/authority',         require('./authorityRoutes'));

// Generic persistence store — MUST be last so it only catches collections that
// have no bespoke typed route above (alerts, risk_signals, contracts, ...).
router.use('/:collection',   require('./collectionRoutes'));

module.exports = router;
