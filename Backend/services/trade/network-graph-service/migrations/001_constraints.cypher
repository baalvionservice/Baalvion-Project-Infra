// 001_constraints.cypher — uniqueness + tenant indexes for the trade relationship graph.
CREATE CONSTRAINT org_id IF NOT EXISTS FOR (o:Organization) REQUIRE o.id IS UNIQUE;
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT product_id IF NOT EXISTS FOR (pr:Product) REQUIRE pr.id IS UNIQUE;
CREATE CONSTRAINT shipment_id IF NOT EXISTS FOR (s:Shipment) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT bank_id IF NOT EXISTS FOR (b:Bank) REQUIRE b.id IS UNIQUE;
CREATE CONSTRAINT sanction_id IF NOT EXISTS FOR (x:SanctionedEntity) REQUIRE x.id IS UNIQUE;
CREATE INDEX org_tenant IF NOT EXISTS FOR (o:Organization) ON (o.orgId);
CREATE INDEX product_tenant IF NOT EXISTS FOR (pr:Product) ON (pr.orgId);
CREATE INDEX shipment_tenant IF NOT EXISTS FOR (s:Shipment) ON (s.orgId);
