-- Down for 033.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.compliance_rule_evaluations;
DROP TABLE IF EXISTS tradeops.compliance_rule_evaluations;
DROP TABLE IF EXISTS tradeops.compliance_rules;
