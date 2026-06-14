-- Fix transactions.metadata type to match the JPA entity.
-- V001 created `metadata jsonb`, but Transaction.metadata is mapped @Column(columnDefinition = "TEXT").
-- Hibernate ddl-auto=validate fails on the jsonb/text mismatch ("wrong column type ... found
-- jsonb, expecting text"). Align the column to text (metadata is a free-form JSON-as-string).
ALTER TABLE payments.transactions ALTER COLUMN metadata TYPE text USING metadata::text;
