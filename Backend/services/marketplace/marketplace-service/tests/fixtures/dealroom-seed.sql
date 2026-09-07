-- Local verification fixture: one company org running a live round, two unrelated investor orgs.
SET search_path TO marketplace, public;

DELETE FROM deals WHERE org_id_company = 'aaaaaaaa-0000-4000-8000-000000000001';
DELETE FROM opportunities WHERE org_id = 'aaaaaaaa-0000-4000-8000-000000000001';
DELETE FROM companies WHERE org_id = 'aaaaaaaa-0000-4000-8000-000000000001';

INSERT INTO companies (id, org_id, legal_name, brand_name, country, industry_code, stage, status, kyc_status)
VALUES ('11111111-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001',
        'Northwind Robotics Pvt Ltd','Northwind','IN','robotics','growth','approved','verified');

INSERT INTO opportunities (id, org_id, company_id, title, round, amount_sought, pre_money_valuation,
                           equity_offered_pct, min_ticket, status, visibility, published_at)
VALUES ('22222222-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001',
        '11111111-0000-4000-8000-000000000001','Series B — warehouse automation rollout',
        'series_b', 2000000, 10000000, 16.7, 250000, 'live', 'public', now());

-- Investor records for the three test orgs. accreditation/kyc/aml gate the term sheet, so a
-- properly onboarded investor is part of the fixture, not an afterthought.
--   A, B  cleared      — can put terms on the table
--   C     unverified   — must be refused at the term sheet
DELETE FROM investors WHERE org_id IN (
  'bbbbbbbb-0000-4000-8000-00000000000a',
  'cccccccc-0000-4000-8000-00000000000b',
  'dddddddd-0000-4000-8000-00000000000c');

INSERT INTO investors (org_id, type, legal_name, country, status, kyc_status, aml_status, accreditation_status) VALUES
 ('bbbbbbbb-0000-4000-8000-00000000000a','vc','Aurora Capital Partners','IN','approved','verified','clear','verified'),
 ('cccccccc-0000-4000-8000-00000000000b','vc','Meridian Growth Fund','IN','approved','verified','clear','verified'),
 ('dddddddd-0000-4000-8000-00000000000c','angel','Unverified Angel','IN','submitted','pending','pending','in_review');
