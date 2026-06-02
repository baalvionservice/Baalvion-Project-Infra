const { Sequelize } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    schema: config.db.schema,
    logging: config.db.logging,
    pool: config.db.pool,
  }
);

const db = {
  sequelize,
  Sequelize,
  Transaction: require('./Transaction')(sequelize),
  // Gateway-checkout vertical (Razorpay/Stripe/PayU), keyed by website slug.
  GatewayPayment: require('./GatewayPayment')(sequelize),
  PaymentLedgerEntry: require('./PaymentLedgerEntry')(sequelize),
};

// A payment has many ledger entries (one per provider event).
db.GatewayPayment.hasMany(db.PaymentLedgerEntry, { foreignKey: 'gateway_payment_id', as: 'ledgerEntries' });
db.PaymentLedgerEntry.belongsTo(db.GatewayPayment, { foreignKey: 'gateway_payment_id', as: 'payment' });

module.exports = db;
