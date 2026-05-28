-- 024_network_intelligence.down.sql — rollback

BEGIN;

DROP TRIGGER IF EXISTS trg_inference_logs_no_mutate ON public.inference_logs;

DROP TABLE IF EXISTS public.inference_logs;
DROP TABLE IF EXISTS public.anomaly_events;
DROP TABLE IF EXISTS public.forecasts;
DROP TABLE IF EXISTS public.ban_probability_models;
DROP TABLE IF EXISTS public.geo_latency_models;
DROP TABLE IF EXISTS public.asn_quality_scores;
DROP TABLE IF EXISTS public.provider_features;
DROP TABLE IF EXISTS public.ml_model_metrics;
DROP TABLE IF EXISTS public.ml_models;

COMMIT;
