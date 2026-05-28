'use strict';

/**
 * OpenTelemetry tracing initialisation.
 *
 * Call startTracing() as early as possible — ideally before any other require()
 * so that auto-instrumentation patches apply to all subsequently loaded modules.
 *
 * Packages required (listed in devDependencies):
 *   @opentelemetry/sdk-node
 *   @opentelemetry/auto-instrumentations-node
 *   @opentelemetry/exporter-trace-otlp-http
 */

const { NodeSDK }                          = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations }      = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter }               = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource }                         = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME }         = require('@opentelemetry/semantic-conventions');
const { trace }                            = require('@opentelemetry/api');

const OTLP_ENDPOINT  = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
const SERVICE_NAME   = process.env.OTEL_SERVICE_NAME            || 'proxy-backend';

let sdk;

/**
 * startTracing — initialise and start the OpenTelemetry SDK.
 *
 * Safe to call multiple times; subsequent calls are no-ops.
 */
function startTracing() {
    if (sdk) return;

    const exporter = new OTLPTraceExporter({
        url: `${OTLP_ENDPOINT}/v1/traces`,
    });

    sdk = new NodeSDK({
        resource: new Resource({
            [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
        }),
        traceExporter: exporter,
        instrumentations: [
            getNodeAutoInstrumentations({
                // Disable fs instrumentation to reduce noise
                '@opentelemetry/instrumentation-fs': { enabled: false },
            }),
        ],
    });

    sdk.start();
    console.log(`[tracing] started — service=${SERVICE_NAME} otlp=${OTLP_ENDPOINT}`);

    // Graceful shutdown
    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => console.log('[tracing] SDK shut down'))
            .catch((err) => console.error('[tracing] SDK shutdown error:', err))
            .finally(() => process.exit(0));
    });
}

/**
 * tracer — a named tracer instance for manual instrumentation.
 *
 * Usage:
 *   const span = tracer.startSpan('my-operation');
 *   // ... do work ...
 *   span.end();
 */
const tracer = trace.getTracer(SERVICE_NAME);

module.exports = { startTracing, tracer };
