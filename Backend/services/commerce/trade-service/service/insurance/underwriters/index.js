'use strict';
/**
 * Underwriter adapter REGISTRY. An underwriter row names its `adapter`; this
 * resolves that name to a live adapter instance.
 *
 * Adding a real carrier is additive: implement an UnderwriterAdapter subclass
 * (e.g. redkikAdapter.js), `registerAdapter('redkik', (uw) => new RedkikAdapter(uw))`,
 * and set the underwriter row's `adapter` column to 'redkik'. Nothing else changes.
 *
 * 'manual' is always available and is the default — a binder that is administered by
 * email and spreadsheets is still a real binder, and is how every one of these
 * relationships starts before an API is opened up.
 */
const { UnderwriterAdapter, ManualUnderwriter } = require('./baseUnderwriter');

const FACTORIES = { manual: (uw) => new ManualUnderwriter({ underwriter: uw }) };

function registerAdapter(name, factory) {
    if (typeof factory !== 'function') throw new Error('registerAdapter(): expected a factory function');
    FACTORIES[name] = factory;
}

/** Resolve the adapter for an underwriter row. Unknown adapter → manual, loudly. */
function adapterFor(underwriter) {
    const name = (underwriter && underwriter.adapter) || 'manual';
    const factory = FACTORIES[name];
    if (!factory) {
        // eslint-disable-next-line no-console
        console.warn(`[insurance] underwriter ${underwriter && underwriter.id} names adapter '${name}', which is not registered — falling back to manual`);
        return FACTORIES.manual(underwriter);
    }
    return factory(underwriter);
}

const supportedAdapters = () => Object.keys(FACTORIES);

module.exports = { registerAdapter, adapterFor, supportedAdapters, UnderwriterAdapter };
