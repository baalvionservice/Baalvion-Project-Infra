-- 060 — Shipment Tracking & Global Visibility Platform: proof of delivery.
--
--   • tradeops.proof_of_delivery — one row per completed delivery capture
--     (receiver, signature, photos, barcode/QR, GPS, OTP verification),
--     written by service/tracking-platform/proofOfDeliveryService.js.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.proof_of_delivery (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id     uuid          NOT NULL,
    receiver_name   text,
    signature_url   text,
    photo_urls      jsonb         NOT NULL DEFAULT '[]'::jsonb,
    barcode         text,
    qr_code         text,
    latitude        numeric(9,6),
    longitude       numeric(9,6),
    delivered_at    timestamptz   NOT NULL DEFAULT now(),
    otp_verified    boolean       NOT NULL DEFAULT false,
    notes           text,
    metadata        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_by      text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_proof_of_delivery_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proof_of_delivery_tenant   ON tradeops.proof_of_delivery (tenant_id);
CREATE INDEX IF NOT EXISTS idx_proof_of_delivery_shipment ON tradeops.proof_of_delivery (shipment_id);

ALTER TABLE tradeops.proof_of_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.proof_of_delivery FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.proof_of_delivery;
CREATE POLICY tenant_isolation ON tradeops.proof_of_delivery
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));
