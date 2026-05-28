--
-- PostgreSQL database dump
--

\restrict UNi3YL9bo31YwN4W6bEbp2ZfAoA8idV9l7EI0OoKJ6z3moVJjD7lvbllehUj7xn

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: organizations; Type: TABLE; Schema: auth; Owner: baalvion
--

CREATE TABLE auth.organizations (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    plan character varying(50) DEFAULT 'free'::character varying NOT NULL,
    owner_id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.organizations OWNER TO baalvion;

--
-- Name: team_members; Type: TABLE; Schema: auth; Owner: baalvion
--

CREATE TABLE auth.team_members (
    id bigint NOT NULL,
    org_id uuid NOT NULL,
    user_id bigint NOT NULL,
    role character varying(32) DEFAULT 'member'::character varying NOT NULL,
    service_roles jsonb DEFAULT '{}'::jsonb NOT NULL,
    invited_by bigint,
    joined_at timestamp with time zone,
    status character varying(16) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.team_members OWNER TO baalvion;

--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: auth; Owner: baalvion
--

CREATE SEQUENCE auth.team_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth.team_members_id_seq OWNER TO baalvion;

--
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: baalvion
--

ALTER SEQUENCE auth.team_members_id_seq OWNED BY auth.team_members.id;


--
-- Name: users; Type: TABLE; Schema: auth; Owner: baalvion
--

CREATE TABLE auth.users (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    full_name text,
    avatar_url text,
    status character varying(16) DEFAULT 'active'::character varying NOT NULL,
    email_verified_at timestamp with time zone,
    mfa_enabled boolean DEFAULT false NOT NULL,
    mfa_secret text,
    mfa_pending_secret text,
    recovery_codes jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    password_reset_required boolean DEFAULT false NOT NULL,
    imported_from character varying(40)
);


ALTER TABLE auth.users OWNER TO baalvion;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: auth; Owner: baalvion
--

CREATE SEQUENCE auth.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth.users_id_seq OWNER TO baalvion;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: baalvion
--

ALTER SEQUENCE auth.users_id_seq OWNED BY auth.users.id;


--
-- Name: team_members id; Type: DEFAULT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.team_members ALTER COLUMN id SET DEFAULT nextval('auth.team_members_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.users ALTER COLUMN id SET DEFAULT nextval('auth.users_id_seq'::regclass);


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: auth; Owner: baalvion
--

COPY auth.organizations (id, name, slug, plan, owner_id, created_at, updated_at) FROM stdin;
e6d7c40d-ba03-402b-a7c5-6ee74c940e4e	Test Org	test-org-c63af8	free	1	2026-05-24 04:20:20.458+00	2026-05-24 04:20:20.458+00
50181a81-5e11-4a24-90c1-17cce2992997	test-probe@baalvion.com's Workspace	test-probe-64c917	free	2	2026-05-24 09:42:24.705+00	2026-05-24 09:42:24.705+00
996dec09-f261-4745-910c-88e518e6f293	e2e-test@baalvion.com's Workspace	e2e-test-0d0747	free	3	2026-05-24 09:45:54.166+00	2026-05-24 09:45:54.166+00
6afc960e-4608-4987-856b-76653b6e1035	RS256 Tester's Workspace	rs256-tester-s-workspace-eee398	free	4	2026-05-24 09:57:39.202+00	2026-05-24 09:57:39.202+00
1e96613d-1c0e-4f9d-9445-59709ef21fb4	Audit Org	audit-org-e3adef	free	5	2026-05-27 17:14:16.891+00	2026-05-27 17:14:16.891+00
1fd508b6-8fbd-468b-b04a-d3e86697f3ee	Validation Org 1779916900	validation-org-1779916900-2a4f47	free	6	2026-05-27 21:21:40.991+00	2026-05-27 21:21:40.991+00
4d62965d-a053-48a3-b7d6-ca4c57ae4e9a	XVal Org 1779917173662	xval-org-1779917173662-c6c2e4	free	7	2026-05-27 21:26:13.749+00	2026-05-27 21:26:13.749+00
6f85846f-5451-4685-ac55-46643570b0c3	XOrg1779917296499	xorg1779917296499-e53cc3	free	8	2026-05-27 21:28:16.573+00	2026-05-27 21:28:16.573+00
20207198-bc85-4b32-b26a-e4cc3f995217	DBVal1779918411936	dbval1779918411936-196947	free	9	2026-05-27 21:46:52.019+00	2026-05-27 21:46:52.019+00
b7d90460-f80e-4c10-b8c8-9ecd9e8b5414	FixVal1779919816	fixval1779919816-93deb6	free	10	2026-05-27 22:10:16.839+00	2026-05-27 22:10:16.839+00
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: auth; Owner: baalvion
--

COPY auth.team_members (id, org_id, user_id, role, service_roles, invited_by, joined_at, status, created_at, updated_at) FROM stdin;
1	e6d7c40d-ba03-402b-a7c5-6ee74c940e4e	1	owner	{}	\N	2026-05-24 04:20:20.461+00	active	2026-05-24 04:20:20.462+00	2026-05-24 04:20:20.462+00
2	50181a81-5e11-4a24-90c1-17cce2992997	2	owner	{}	\N	2026-05-24 09:42:24.708+00	active	2026-05-24 09:42:24.708+00	2026-05-24 09:42:24.708+00
3	996dec09-f261-4745-910c-88e518e6f293	3	owner	{}	\N	2026-05-24 09:45:54.168+00	active	2026-05-24 09:45:54.168+00	2026-05-24 09:45:54.168+00
4	6afc960e-4608-4987-856b-76653b6e1035	4	owner	{}	\N	2026-05-24 09:57:39.207+00	active	2026-05-24 09:57:39.207+00	2026-05-24 09:57:39.207+00
5	1e96613d-1c0e-4f9d-9445-59709ef21fb4	5	owner	{}	\N	2026-05-27 17:14:16.897+00	active	2026-05-27 17:14:16.897+00	2026-05-27 17:14:16.897+00
6	1fd508b6-8fbd-468b-b04a-d3e86697f3ee	6	owner	{}	\N	2026-05-27 21:21:40.998+00	active	2026-05-27 21:21:40.998+00	2026-05-27 21:21:40.998+00
7	4d62965d-a053-48a3-b7d6-ca4c57ae4e9a	7	owner	{}	\N	2026-05-27 21:26:13.752+00	active	2026-05-27 21:26:13.752+00	2026-05-27 21:26:13.752+00
8	6f85846f-5451-4685-ac55-46643570b0c3	8	owner	{}	\N	2026-05-27 21:28:16.575+00	active	2026-05-27 21:28:16.575+00	2026-05-27 21:28:16.575+00
9	20207198-bc85-4b32-b26a-e4cc3f995217	9	owner	{}	\N	2026-05-27 21:46:52.022+00	active	2026-05-27 21:46:52.023+00	2026-05-27 21:46:52.023+00
10	b7d90460-f80e-4c10-b8c8-9ecd9e8b5414	10	owner	{}	\N	2026-05-27 22:10:16.842+00	active	2026-05-27 22:10:16.842+00	2026-05-27 22:10:16.842+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: baalvion
--

COPY auth.users (id, email, password_hash, full_name, avatar_url, status, email_verified_at, mfa_enabled, mfa_secret, mfa_pending_secret, recovery_codes, created_at, updated_at, password_reset_required, imported_from) FROM stdin;
1	test@baalvion.com	$2b$12$30qbOFLB6eQXFlTMFgArbOEMwci./.Oytm3L136tRz.SQ5mo0D9C2	Test User	\N	active	\N	f	\N	\N	[]	2026-05-24 04:20:20.45+00	2026-05-24 04:20:20.45+00	f	\N
2	test-probe@baalvion.com	$2b$12$Nd7qjiCEE.AHqNkHkuhf9uPRpPhorCZVDCml3DnPTWOKJ6U0aj2ly	Test User	\N	active	\N	f	\N	\N	[]	2026-05-24 09:42:24.699+00	2026-05-24 09:42:24.699+00	f	\N
3	e2e-test@baalvion.com	$2b$12$0C2hbW7cOBzcfAkX.8FTEOCYkZQu3ZT5KgHp7ZwdH/niF.0mPjf7C	E2E Tester	\N	active	\N	f	\N	\N	[]	2026-05-24 09:45:54.162+00	2026-05-24 09:45:54.162+00	f	\N
4	rs256-test@baalvion.com	$argon2id$v=19$m=65536,t=3,p=4$2/+p1Rhw9c5JWrKsQ+Wp1A$NTe5kjGUCbBZGcQFUsYpR5HIoOv8rgH8HW581+rzyxo	RS256 Tester	\N	active	\N	f	\N	\N	[]	2026-05-24 09:57:39.197+00	2026-05-24 09:57:39.197+00	f	\N
5	audit@baalvion.test	$argon2id$v=19$m=65536,t=3,p=4$I9AopQ3aRcqjSqbu62NrRA$EwBnaGMXrg4haJ2C69w5tcpsEklGKTxp0JKQnqtlGTw	Audit User	\N	active	\N	f	\N	\N	[]	2026-05-27 17:14:16.883+00	2026-05-27 17:14:16.883+00	f	\N
6	val+1779916900@baalvion.test	$argon2id$v=19$m=65536,t=3,p=4$yA3K8g4JGO0AFl6vE67lyQ$i+pNHzIwPD2HV2TTr09qQvjNR3jwVIgYAJ+cLmgKPsU	Validation User	\N	active	\N	f	\N	\N	[]	2026-05-27 21:21:40.982+00	2026-05-27 21:21:40.982+00	f	\N
7	xval+1779917173662@baalvion.test	$argon2id$v=19$m=65536,t=3,p=4$DammyjCf2lRKkz3XkoQJYA$WdkD8GbosPaF+drrbsh6VRAyW5lQiAp8Oy3nviXRi5U	XVal	\N	active	\N	f	\N	\N	[]	2026-05-27 21:26:13.745+00	2026-05-27 21:26:13.745+00	f	\N
8	xval2+1779917296499@baalvion.test	$argon2id$v=19$m=65536,t=3,p=4$lY/7h8GtkrXFpdokPcIu6A$O7Ob28ddeiKi88/v40cO1vJfEGi+xOkue55AHH0ozQ0	X	\N	active	\N	f	\N	\N	[]	2026-05-27 21:28:16.57+00	2026-05-27 21:28:16.57+00	f	\N
9	dbval+1779918411936@baalvion.test	$argon2id$v=19$m=65536,t=3,p=4$AXCJwHYjl77iJ0St1kX11Q$S+KhGwu1isayFycBXr3l6+p23USKwEcSYJukdS6QmUo	DBVal	\N	active	\N	f	\N	\N	[]	2026-05-27 21:46:52.016+00	2026-05-27 21:46:52.016+00	f	\N
10	fixval+1779919816@baalvion.test	$argon2id$v=19$m=65536,t=3,p=4$+54F64Wcpsi9FaHg+KDJ0A$saAv04q+gySlxwhb8y6Iegueuod0oJgk5g4u/X5xX4Q	\N	\N	active	\N	f	\N	\N	[]	2026-05-27 22:10:16.836+00	2026-05-27 22:10:16.836+00	f	\N
\.


--
-- Name: team_members_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: baalvion
--

SELECT pg_catalog.setval('auth.team_members_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: baalvion
--

SELECT pg_catalog.setval('auth.users_id_seq', 10, true);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: team_members team_members_org_user_uniq; Type: CONSTRAINT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.team_members
    ADD CONSTRAINT team_members_org_user_uniq UNIQUE (org_id, user_id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_users_imported_from; Type: INDEX; Schema: auth; Owner: baalvion
--

CREATE INDEX idx_users_imported_from ON auth.users USING btree (imported_from) WHERE (imported_from IS NOT NULL);


--
-- Name: idx_users_pw_reset_required; Type: INDEX; Schema: auth; Owner: baalvion
--

CREATE INDEX idx_users_pw_reset_required ON auth.users USING btree (password_reset_required) WHERE (password_reset_required = true);


--
-- Name: organizations_owner_id; Type: INDEX; Schema: auth; Owner: baalvion
--

CREATE INDEX organizations_owner_id ON auth.organizations USING btree (owner_id);


--
-- Name: organizations_slug; Type: INDEX; Schema: auth; Owner: baalvion
--

CREATE UNIQUE INDEX organizations_slug ON auth.organizations USING btree (slug);


--
-- Name: team_members_org_id_user_id; Type: INDEX; Schema: auth; Owner: baalvion
--

CREATE UNIQUE INDEX team_members_org_id_user_id ON auth.team_members USING btree (org_id, user_id);


--
-- Name: team_members_user_id; Type: INDEX; Schema: auth; Owner: baalvion
--

CREATE INDEX team_members_user_id ON auth.team_members USING btree (user_id);


--
-- Name: users_email; Type: INDEX; Schema: auth; Owner: baalvion
--

CREATE UNIQUE INDEX users_email ON auth.users USING btree (email);


--
-- Name: users_status; Type: INDEX; Schema: auth; Owner: baalvion
--

CREATE INDEX users_status ON auth.users USING btree (status);


--
-- Name: team_members team_members_org_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.team_members
    ADD CONSTRAINT team_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES auth.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: baalvion
--

ALTER TABLE ONLY auth.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict UNi3YL9bo31YwN4W6bEbp2ZfAoA8idV9l7EI0OoKJ6z3moVJjD7lvbllehUj7xn

