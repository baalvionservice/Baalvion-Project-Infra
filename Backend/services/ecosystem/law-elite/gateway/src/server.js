require('dotenv').config();
const app = require('./app');

// Gateway routes here as law-elite-gateway:8090 (infra/api-gateway/dynamic.yml).
const PORT = process.env.PORT || 8090;

app.listen(PORT, () => {
  console.log(`[GATEWAY] Authority Command active on port ${PORT}`);
});