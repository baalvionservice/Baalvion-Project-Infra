-- 090 — what each party may see of the records behind an order journey.
-- One function, tradeops.journey_records(journey, org), returns the shipments, bookings, documents,
-- customs filings and proof of delivery that belong to the order, with price columns left out, and
-- only the kinds the caller's permissions allow. It is SECURITY DEFINER because the underlying
-- tables belong to whichever organisation created each record; a record is included only when its
-- owner is itself an active party to the journey, so nobody can attach a record to someone else's order.
-- The caller must be the organisation the connection says it is acting for, so the function cannot be
-- asked for another party's view.
-- Never selected: declared_value, amount, quotes, selected_quote, request, declaration, metadata, total_value.

CREATE OR REPLACE FUNCTION tradeops.journey_records(p_journey uuid, p_org text) RETURNS TABLE (kind text, record_id uuid, status text, title text, detail jsonb, occurred_at timestamptz, owner_org text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = tradeops, pg_temp AS $$
WITH me AS (SELECT p.permissions AS perms, p.document_scopes AS scopes FROM tradeops.order_parties p WHERE p.journey_id = p_journey AND p.org_id = p_org AND p_org = tradeops.current_party_org() AND p.status = 'active' AND 'journey.view' = ANY (p.permissions) LIMIT 1),
orgs AS (SELECT p.org_id FROM tradeops.order_parties p WHERE p.journey_id = p_journey AND p.status = 'active' AND p.org_id IS NOT NULL),
jr AS (SELECT j.order_id FROM tradeops.order_journeys j WHERE j.id = p_journey AND EXISTS (SELECT 1 FROM me)),
ops AS (SELECT t.id, t.tenant_id, t.reference_no, t.status, t.created_at FROM tradeops.trade_operations t WHERE t.order_id = (SELECT order_id FROM jr) AND t.deleted_at IS NULL AND t.tenant_id IN (SELECT org_id FROM orgs)),
shp AS (SELECT s.* FROM tradeops.shipments s WHERE s.deleted_at IS NULL AND s.tenant_id IN (SELECT org_id FROM orgs) AND s.trade_operation_id IN (SELECT id FROM ops))
SELECT 'trade_operation'::text, o.id, o.status, o.reference_no, '{}'::jsonb, o.created_at, o.tenant_id FROM ops o
UNION ALL
SELECT 'shipment', s.id, s.status, s.shipment_no, jsonb_build_object('mode', s.mode, 'carrier', s.carrier_name, 'vessel', s.vessel_name, 'voyage', s.voyage_no, 'container', s.container_no, 'billOfLading', s.bill_of_lading_no, 'originPort', s.origin_port, 'destinationPort', s.destination_port, 'originCountry', s.origin_country, 'destinationCountry', s.destination_country, 'estimatedDeparture', s.estimated_departure, 'actualDeparture', s.actual_departure, 'estimatedArrival', s.estimated_arrival, 'actualArrival', s.actual_arrival, 'trackingNumber', s.tracking_number), s.updated_at, s.tenant_id FROM shp s WHERE EXISTS (SELECT 1 FROM me WHERE 'logistics.view' = ANY (me.perms) OR 'tracking.view' = ANY (me.perms))
UNION ALL
SELECT 'freight_booking', b.id, b.status, b.carrier, jsonb_build_object('mode', b.mode, 'serviceLevel', b.service_level, 'trackingNumber', b.tracking_number, 'estimatedDelivery', b.estimated_delivery, 'bookedAt', b.booked_at, 'shipmentId', b.shipment_id), b.updated_at, b.tenant_id FROM tradeops.freight_bookings b WHERE EXISTS (SELECT 1 FROM me WHERE 'logistics.view' = ANY (me.perms)) AND b.tenant_id IN (SELECT org_id FROM orgs) AND (b.trade_operation_id IN (SELECT id FROM ops) OR b.order_id = (SELECT order_id FROM jr)::text)
UNION ALL
SELECT 'document', d.id, d.status, d.title, jsonb_build_object('docType', d.doc_type, 'issuedAt', d.issued_at, 'expiresAt', d.expires_at, 'shipmentId', d.shipment_id), d.updated_at, d.tenant_id FROM tradeops.documents d WHERE d.deleted_at IS NULL AND d.tenant_id IN (SELECT org_id FROM orgs) AND (d.trade_operation_id IN (SELECT id FROM ops) OR d.shipment_id IN (SELECT id FROM shp)) AND EXISTS (SELECT 1 FROM me WHERE 'documents.view' = ANY (me.perms) AND d.doc_type = ANY (me.scopes))
UNION ALL
SELECT 'customs_filing', c.id, c.status, c.direction, jsonb_build_object('direction', c.direction, 'channel', c.channel, 'originCountry', c.origin_country, 'destinationCountry', c.destination_country, 'gatewayStatus', c.gateway_status, 'submittedAt', c.submitted_at, 'completedAt', c.completed_at, 'shipmentId', c.shipment_id), c.updated_at, c.tenant_id FROM tradeops.customs_submissions c WHERE c.tenant_id IN (SELECT org_id FROM orgs) AND (c.trade_operation_id IN (SELECT id FROM ops) OR c.shipment_id IN (SELECT id FROM shp)) AND EXISTS (SELECT 1 FROM me WHERE 'customs.view' = ANY (me.perms))
UNION ALL
SELECT 'proof_of_delivery', p.id, 'delivered', p.receiver_name, jsonb_build_object('deliveredAt', p.delivered_at, 'receiverName', p.receiver_name, 'shipmentId', p.shipment_id), COALESCE(p.delivered_at, p.created_at), p.tenant_id FROM tradeops.proof_of_delivery p WHERE p.tenant_id IN (SELECT org_id FROM orgs) AND p.shipment_id IN (SELECT id FROM shp) AND EXISTS (SELECT 1 FROM me WHERE 'tracking.view' = ANY (me.perms))
$$;

REVOKE ALL ON FUNCTION tradeops.journey_records(uuid, text) FROM PUBLIC;
