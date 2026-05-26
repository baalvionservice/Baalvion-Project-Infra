-- Create all schemas for Baalvion services
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS jobs;
CREATE SCHEMA IF NOT EXISTS mining;
CREATE SCHEMA IF NOT EXISTS imperialpedia;
CREATE SCHEMA IF NOT EXISTS real_estate;
CREATE SCHEMA IF NOT EXISTS brand;
CREATE SCHEMA IF NOT EXISTS market;
CREATE SCHEMA IF NOT EXISTS ir;
CREATE SCHEMA IF NOT EXISTS dashboard;
CREATE SCHEMA IF NOT EXISTS about;
CREATE SCHEMA IF NOT EXISTS cms;
CREATE SCHEMA IF NOT EXISTS commerce;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS fulfillment;

-- Grant all privileges on all schemas to baalvion user
GRANT ALL PRIVILEGES ON SCHEMA auth TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA jobs TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA mining TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA imperialpedia TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA real_estate TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA brand TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA market TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA ir TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA dashboard TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA about TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA cms TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA commerce TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA orders TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA inventory TO baalvion;
GRANT ALL PRIVILEGES ON SCHEMA fulfillment TO baalvion;
GRANT ALL PRIVILEGES ON DATABASE baalvion_db TO baalvion;

-- Set search path
ALTER ROLE baalvion SET search_path TO public, auth, jobs, mining, imperialpedia, real_estate, brand, market, ir, dashboard, about, cms, commerce, orders, inventory, fulfillment;
