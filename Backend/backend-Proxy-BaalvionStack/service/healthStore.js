// In-memory health store for provider health and circuit breaker
const healthData = {};

module.exports = {
  get(provider) {
    return healthData[provider] || {
      status: 'unknown',
      latency: null,
      lastChecked: null,
      failureCount: 0,
      cooldownUntil: null,
    };
  },
  set(provider, data) {
    healthData[provider] = { ...healthData[provider], ...data };
  },
  getAll() {
    return Object.keys(healthData).reduce((acc, provider) => {
      acc[provider] = this.get(provider);
      return acc;
    }, {});
  },
};