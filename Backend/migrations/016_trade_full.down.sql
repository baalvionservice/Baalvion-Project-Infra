-- Rollback Migration 016: Trade Schema
-- WARNING: This drops the entire trade schema and all its data irreversibly.
-- Run: psql -U baalvion -d baalvion_db -f 016_trade_full.down.sql

DROP SCHEMA IF EXISTS trade CASCADE;
